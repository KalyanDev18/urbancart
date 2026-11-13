from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from .models import Order, Product, OrderItem, SupportTicket


class OrderCancelReturnSupportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='buyer', email='buyer@example.com', password='pass1234', first_name='Kalyan')
        self.other_user = User.objects.create_user(username='other', email='other@example.com', password='pass1234')
        self.product = Product.objects.create(name='Urban Sneaker', category='Footwear', price=Decimal('2999.00'))
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _create_order(self, order_status='Processing', payment_status='Paid', payment_method='UPI'):
        order = Order.objects.create(
            user=self.user,
            full_name='Kalyan Dev',
            email='buyer@example.com',
            address='MG Road 12',
            city='Mumbai',
            postal_code='400001',
            total_amount=Decimal('3098.00'),
            payment_method=payment_method,
            payment_status=payment_status,
            order_status=order_status,
            transaction_id='PAY-INR-TEST1',
        )
        OrderItem.objects.create(order=order, product=self.product, price=self.product.price, quantity=1)
        return order

    def test_cancel_paid_processing_order_initiates_refund_and_ticket(self):
        order = self._create_order(order_status='Processing', payment_status='Paid', payment_method='UPI')
        res = self.client.post(f'/api/orders/{order.id}/cancel/', {'reason': 'Ordered by mistake'}, format='json')
        self.assertEqual(res.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.order_status, 'Cancelled')
        self.assertEqual(order.payment_status, 'Refund Initiated')
        self.assertEqual(order.refund_amount, Decimal('3098.00'))
        self.assertTrue(order.refund_reference.startswith('REF-'))
        self.assertEqual(SupportTicket.objects.filter(order=order, issue_type='CANCEL').count(), 1)

    def test_cannot_cancel_delivered_order(self):
        order = self._create_order(order_status='Delivered', payment_status='Paid')
        res = self.client.post(f'/api/orders/{order.id}/cancel/', {'reason': 'No longer needed'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_return_delivered_order_within_window_creates_refund_and_ticket(self):
        order = self._create_order(order_status='Delivered', payment_status='Paid')
        res = self.client.post(f'/api/orders/{order.id}/return/', {
            'reason': 'Size too small',
            'resolution': 'REFUND',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.order_status, 'Return Requested')
        self.assertEqual(order.payment_status, 'Refund Initiated')
        self.assertTrue(order.refund_reference.startswith('RET-'))
        self.assertEqual(SupportTicket.objects.filter(order=order, issue_type='RETURN').count(), 1)

    def test_cannot_return_expired_order(self):
        order = self._create_order(order_status='Delivered', payment_status='Paid')
        Order.objects.filter(id=order.id).update(created_at=timezone.now() - timedelta(days=9))
        res = self.client.post(f'/api/orders/{order.id}/return/', {'reason': 'Late return'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_cannot_cancel_another_users_order(self):
        order = self._create_order(order_status='Processing', payment_status='Paid')
        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)
        res = other_client.post(f'/api/orders/{order.id}/cancel/', {'reason': 'Hijack'}, format='json')
        self.assertEqual(res.status_code, 404)

    def test_support_ticket_creation_and_listing(self):
        order = self._create_order()
        post_res = self.client.post('/api/support/tickets/', {
            'order_id': order.id,
            'issue_type': 'DELIVERY',
            'subject': 'Where is my courier?',
            'message': 'Please share express pickup time.',
        }, format='json')
        self.assertEqual(post_res.status_code, 201)
        list_res = self.client.get('/api/support/tickets/')
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.data['tickets']), 1)

    def test_chatbot_cancel_and_support_routing(self):
        order = self._create_order(order_status='Processing', payment_status='Paid')
        res_cancel = self.client.post('/api/chatbot/', {'message': f'Cancel order #{order.id}'}, format='json')
        self.assertEqual(res_cancel.status_code, 200)
        self.assertEqual(res_cancel.data.get('action'), 'open_orders')
        res_support = self.client.post('/api/chatbot/', {'message': 'Talk to customer support agent'}, format='json')
        self.assertEqual(res_support.status_code, 200)
        self.assertEqual(res_support.data.get('action'), 'open_support')


class AdminAccessAndControlTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='regularbuyer',
            email='regular@example.com',
            password='userpass123',
            first_name='Regular',
        )
        self.admin_user = User.objects.create_superuser(
            username='staffadmin',
            email='staffadmin@example.com',
            password='StrongTestPassword!99',
        )
        self.product = Product.objects.create(
            name='Studio Headphones',
            category='Electronics',
            price=Decimal('4999.00'),
            stock=12,
        )
        self.order = Order.objects.create(
            user=self.customer,
            full_name='Regular Buyer',
            email='regular@example.com',
            address='221B Baker St',
            city='Delhi',
            postal_code='110001',
            total_amount=Decimal('4999.00'),
            payment_method='UPI',
            payment_status='Paid',
            order_status='Processing',
        )
        OrderItem.objects.create(order=self.order, product=self.product, price=self.product.price, quantity=1)
        self.ticket = SupportTicket.objects.create(
            user=self.customer,
            order=self.order,
            issue_type='DELIVERY',
            subject='Need invoice copy',
            message='Please send GST invoice.',
        )
        self.client = APIClient()

    def test_non_staff_blocked_from_admin_endpoints(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.get('/api/admin/overview/')
        self.assertEqual(res.status_code, 403)

    def test_staff_overview_order_product_ticket_crud(self):
        self.client.force_authenticate(user=self.admin_user)

        overview = self.client.get('/api/admin/overview/')
        self.assertEqual(overview.status_code, 200)
        self.assertEqual(overview.data['stats']['total_orders'], 1)
        self.assertEqual(overview.data['stats']['total_products'], 1)
        self.assertEqual(overview.data['stats']['active_tickets'], 1)

        # Update order to Returned + Refunded (auto-generates refund amount & reference)
        order_res = self.client.patch(
            f'/api/admin/orders/{self.order.id}/',
            {'order_status': 'Returned', 'payment_status': 'Refunded'},
            format='json',
        )
        self.assertEqual(order_res.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.order_status, 'Returned')
        self.assertEqual(self.order.payment_status, 'Refunded')
        self.assertEqual(self.order.refund_amount, Decimal('4999.00'))
        self.assertTrue(self.order.refund_reference.startswith('RFND-'))

        # Create, update, and delete product
        create_res = self.client.post(
            '/api/admin/products/',
            {'name': 'Mechanical Keypad', 'category': 'Gaming', 'price': '3499.00', 'stock': 8, 'is_featured': True},
            format='json',
        )
        self.assertEqual(create_res.status_code, 201)
        new_pid = create_res.data['product']['id']

        patch_res = self.client.patch(
            f'/api/admin/products/{new_pid}/',
            {'price': '2999.00', 'stock': 3},
            format='json',
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(Decimal(patch_res.data['product']['price']), Decimal('2999.00'))
        self.assertEqual(patch_res.data['product']['stock'], 3)

        del_res = self.client.delete(f'/api/admin/products/{new_pid}/')
        self.assertEqual(del_res.status_code, 200)
        self.assertFalse(Product.objects.filter(id=new_pid).exists())

        # Reply and resolve support ticket
        ticket_res = self.client.patch(
            f'/api/admin/tickets/{self.ticket.id}/',
            {'status': 'Resolved', 'admin_reply': 'Invoice emailed to you!'},
            format='json',
        )
        self.assertEqual(ticket_res.status_code, 200)
        self.ticket.refresh_from_db()
        self.assertEqual(self.ticket.status, 'Resolved')
        self.assertEqual(self.ticket.admin_reply, 'Invoice emailed to you!')

    def test_google_auth_blocks_staff_and_otp_promotes_admin_emails(self):
        import os
        from unittest.mock import patch
        from django.core.management import call_command
        from .models import EmailOTP

        # Existing staff user blocked from Google mock login
        res_block = self.client.post('/api/auth/google/', {'email': 'staffadmin@example.com', 'name': 'Fake'}, format='json')
        self.assertEqual(res_block.status_code, 403)

        # Verified OTP promotes email configured in ADMIN_EMAILS
        EmailOTP.objects.create(email='boss@urbancart.in', otp='654321')
        with patch.dict(os.environ, {'ADMIN_EMAILS': 'boss@urbancart.in'}):
            otp_res = self.client.post('/api/auth/verify-otp/', {'email': 'boss@urbancart.in', 'otp': '654321'}, format='json')
            self.assertEqual(otp_res.status_code, 200)
            self.assertTrue(otp_res.data['user']['is_staff'])

            # ensure_admin creates/updates superuser from env vars
            with patch.dict(os.environ, {
                'DJANGO_SUPERUSER_USERNAME': 'envadmin',
                'DJANGO_SUPERUSER_EMAIL': 'envadmin@urbancart.in',
                'DJANGO_SUPERUSER_PASSWORD': 'EnvAdminTestPassword!42',
            }):
                call_command('ensure_admin')
                env_u = User.objects.get(username='envadmin')
                self.assertTrue(env_u.is_staff)
                self.assertTrue(env_u.is_superuser)
                self.assertTrue(env_u.check_password('EnvAdminTestPassword!42'))

    def test_admin_test_email_api_endpoint(self):
        # Non-staff blocked
        self.client.force_authenticate(user=self.customer)
        block_res = self.client.post('/api/admin/test-email/', {'email': 'friend@example.com'}, format='json')
        self.assertEqual(block_res.status_code, 403)

        # Staff can trigger test
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post('/api/admin/test-email/', {'email': 'friend@example.com'}, format='json')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['recipient'], 'friend@example.com')
        self.assertIn('active_providers', data)


class ProductReviewSystemTests(TestCase):
    def setUp(self):
        self.buyer = User.objects.create_user(
            username='verifiedbuyer',
            email='verified@example.com',
            password='pass1234',
            first_name='Aryan',
        )
        self.other = User.objects.create_user(
            username='browser',
            email='browser@example.com',
            password='pass1234',
            first_name='Riya',
        )
        self.product = Product.objects.create(
            name='Minimalist Hoodie',
            category='Clothing',
            price=Decimal('1999.00'),
        )
        order = Order.objects.create(
            user=self.buyer,
            full_name='Aryan',
            email='verified@example.com',
            address='Lane 1',
            city='Pune',
            postal_code='411001',
            total_amount=Decimal('1999.00'),
            payment_method='UPI',
            payment_status='Paid',
            order_status='Delivered',
        )
        OrderItem.objects.create(order=order, product=self.product, price=self.product.price, quantity=1)
        self.client = APIClient()

    def test_new_product_has_zero_dummy_rating_and_zero_fake_discount(self):
        self.assertEqual(self.product.rating, Decimal('0.0'))
        self.assertEqual(self.product.review_count, 0)
        self.assertEqual(self.product.get_discount_percent(), 0)
        self.assertEqual(self.product.get_original_price(), Decimal('0.00'))

    def test_submit_update_and_delete_product_reviews(self):
        # 1. Unauthenticated POST blocked
        unauth = self.client.post(f'/api/products/{self.product.id}/reviews/', {'rating': 5, 'comment': 'Nice!'}, format='json')
        self.assertEqual(unauth.status_code, 401)

        # 2. Non-purchasing user blocked
        self.client.force_authenticate(user=self.other)
        unpurchased_res = self.client.post(f'/api/products/{self.product.id}/reviews/', {'rating': 3, 'comment': 'Never ordered'}, format='json')
        self.assertEqual(unpurchased_res.status_code, 403)
        self.assertEqual(unpurchased_res.data.get('code'), 'not_purchased')

        # 3. User with in-transit (Processing / Shipped) order blocked until Delivered
        in_transit_order = Order.objects.create(
            user=self.other,
            full_name='Riya',
            email='browser@example.com',
            address='Lane 2',
            city='Pune',
            postal_code='411002',
            total_amount=Decimal('1999.00'),
            payment_method='CARD',
            payment_status='Paid',
            order_status='Shipped',
        )
        OrderItem.objects.create(order=in_transit_order, product=self.product, price=self.product.price, quantity=1)

        transit_res = self.client.post(f'/api/products/{self.product.id}/reviews/', {'rating': 4, 'comment': 'Still on the way'}, format='json')
        self.assertEqual(transit_res.status_code, 400)
        self.assertEqual(transit_res.data.get('code'), 'delivery_pending')

        # 4. Verified buyer with Delivered order submits 5-star review
        self.client.force_authenticate(user=self.buyer)
        res1 = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            {'rating': 5, 'title': 'Great fit', 'comment': 'Fabric quality is super soft.'},
            format='json',
        )
        self.assertEqual(res1.status_code, 201)
        self.assertTrue(res1.data['review']['is_verified_purchase'])
        self.assertEqual(res1.data['average_rating'], '5.0')
        self.assertEqual(res1.data['review_count'], 1)
        rev1_id = res1.data['review']['id']

        # 5. Order gets Delivered -> second user can now submit review
        in_transit_order.order_status = 'Delivered'
        in_transit_order.save()

        self.client.force_authenticate(user=self.other)
        res2 = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            {'rating': 3, 'comment': 'Good color, sizing runs slightly snug.'},
            format='json',
        )
        self.assertEqual(res2.status_code, 201)
        self.assertTrue(res2.data['review']['is_verified_purchase'])
        self.assertEqual(res2.data['average_rating'], '4.0')
        self.assertEqual(res2.data['review_count'], 2)

        # 6. Cannot delete another user's review
        forbidden_del = self.client.delete(f'/api/products/{self.product.id}/reviews/{rev1_id}/')
        self.assertEqual(forbidden_del.status_code, 403)

        # 7. Updating own review recalculates rating
        res2_upd = self.client.post(
            f'/api/products/{self.product.id}/reviews/',
            {'rating': 4, 'comment': 'Fits better after wash.'},
            format='json',
        )
        self.assertEqual(res2_upd.status_code, 200)
        self.assertEqual(res2_upd.data['average_rating'], '4.5')
        self.assertEqual(res2_upd.data['review_count'], 2)

        # 8. Buyer deletes own review -> only other's 4-star remains
        self.client.force_authenticate(user=self.buyer)
        del_res = self.client.delete(f'/api/products/{self.product.id}/reviews/{rev1_id}/')
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.data['average_rating'], '4.0')
        self.assertEqual(del_res.data['review_count'], 1)


class OrderEmailNotificationTests(TestCase):
    def setUp(self):
        from .models import CartItem
        self.customer = User.objects.create_user(
            username='mailbuyer',
            email='mailbuyer@example.com',
            password='userpass123',
            first_name='Rohan',
        )
        self.admin_user = User.objects.create_superuser(
            username='mailadmin',
            email='mailadmin@example.com',
            password='AdminStrongPass!99',
        )
        self.product = Product.objects.create(
            name='Aero Runner Pro',
            category='Footwear',
            price=Decimal('3499.00'),
            stock=10,
        )
        CartItem.objects.create(product=self.product, quantity=2)
        self.client = APIClient()

    def test_order_lifecycle_emails_dispatched_for_all_stages(self):
        import os
        from unittest.mock import patch
        from django.core import mail
        from django.test import override_settings

        clean_env = {'EMAIL_WEBHOOK_URL': '', 'BREVO_API_KEY': '', 'RESEND_API_KEY': ''}
        with override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'):
            with patch.dict(os.environ, clean_env):
                mail.outbox.clear()

                # 1. Checkout -> Order Confirmed email to customer + Store Admin Alert
                self.client.force_authenticate(user=self.customer)
                checkout_res = self.client.post('/api/checkout/', {
                    'full_name': 'Rohan Verma',
                    'email': 'rohan@example.com',
                    'address': '101 Cyber Hub',
                    'city': 'Gurugram',
                    'postal_code': '122002',
                    'payment_method': 'UPI',
                }, format='json')
                self.assertEqual(checkout_res.status_code, 200)
                order_id = checkout_res.data['order']['id']

                # Dispatches 1 email to customer (rohan@example.com) + 1 admin alert to store owner
                self.assertEqual(len(mail.outbox), 2)
                customer_mail = [m for m in mail.outbox if 'rohan@example.com' in m.to][0]
                admin_mail = [m for m in mail.outbox if 'rohan@example.com' not in m.to][0]
                self.assertIn('Order Confirmed', customer_mail.subject)
                self.assertIn('Aero Runner Pro', customer_mail.body)
                self.assertIn('Admin Alert', admin_mail.subject)

                # 2. Admin marks Shipped -> Order Shipped email to customer
                self.client.force_authenticate(user=self.admin_user)
                ship_res = self.client.patch(
                    f'/api/admin/orders/{order_id}/',
                    {'order_status': 'Shipped'},
                    format='json',
                )
                self.assertEqual(ship_res.status_code, 200)
                self.assertEqual(len(mail.outbox), 3)
                self.assertIn('Shipped', mail.outbox[2].subject)

                # 3. Admin marks Delivered -> Order Delivered email to customer
                deliv_res = self.client.patch(
                    f'/api/admin/orders/{order_id}/',
                    {'order_status': 'Delivered', 'payment_status': 'Paid'},
                    format='json',
                )
                self.assertEqual(deliv_res.status_code, 200)
                self.assertEqual(len(mail.outbox), 4)
                self.assertIn('Delivered', mail.outbox[3].subject)

                # 4. Customer requests Return -> Return Request email to customer + Admin alert
                self.client.force_authenticate(user=self.customer)
                ret_res = self.client.post(f'/api/orders/{order_id}/return/', {
                    'reason': 'Need larger size',
                    'resolution': 'REFUND',
                }, format='json')
                self.assertEqual(ret_res.status_code, 200)
                self.assertEqual(len(mail.outbox), 6)
                self.assertTrue(any('Return Request' in m.subject for m in mail.outbox))

                # 5. Admin marks Returned & Refunded -> Refund Processed email
                self.client.force_authenticate(user=self.admin_user)
                rfnd_res = self.client.patch(
                    f'/api/admin/orders/{order_id}/',
                    {'order_status': 'Returned', 'payment_status': 'Refunded'},
                    format='json',
                )
                self.assertEqual(rfnd_res.status_code, 200)
                self.assertEqual(len(mail.outbox), 7)
                self.assertIn('Refund Processed', mail.outbox[6].subject)

    def test_cancel_order_and_ticket_reply_send_emails(self):
        import os
        from unittest.mock import patch
        from django.core import mail
        from django.test import override_settings

        order = Order.objects.create(
            user=self.customer,
            full_name='Rohan Verma',
            email='rohan@example.com',
            address='101 Cyber Hub',
            city='Gurugram',
            postal_code='122002',
            total_amount=Decimal('3499.00'),
            payment_method='CARD',
            payment_status='Paid',
            order_status='Processing',
        )
        OrderItem.objects.create(order=order, product=self.product, price=self.product.price, quantity=1)
        ticket = SupportTicket.objects.create(
            user=self.customer,
            order=order,
            issue_type='DELIVERY',
            subject='Delivery slot query',
            message='When will it reach?',
        )

        clean_env = {'EMAIL_WEBHOOK_URL': '', 'BREVO_API_KEY': '', 'RESEND_API_KEY': ''}
        with override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend'):
            with patch.dict(os.environ, clean_env):
                mail.outbox.clear()

                # Cancel order sends Cancelled email to customer + Admin alert
                self.client.force_authenticate(user=self.customer)
                cxl_res = self.client.post(f'/api/orders/{order.id}/cancel/', {'reason': 'Changed mind'}, format='json')
                self.assertEqual(cxl_res.status_code, 200)
                self.assertEqual(len(mail.outbox), 2)
                customer_cxl = [m for m in mail.outbox if 'rohan@example.com' in m.to][0]
                self.assertIn('Cancelled', customer_cxl.subject)
                self.assertIn('Changed mind', customer_cxl.body)

                # Admin updates support ticket -> email sent to customer
                self.client.force_authenticate(user=self.admin_user)
                t_res = self.client.patch(
                    f'/api/admin/tickets/{ticket.id}/',
                    {'status': 'Resolved', 'admin_reply': 'Refund already processed!'},
                    format='json',
                )
                self.assertEqual(t_res.status_code, 200)
                self.assertEqual(len(mail.outbox), 3)
                self.assertIn('Support Update', mail.outbox[2].subject)
                self.assertIn('Refund already processed!', mail.outbox[2].body)


class OrderTaxInvoiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='invoicebuyer', email='buyer@urban.in', password='pass1234', first_name='Aarav')
        self.other_user = User.objects.create_user(username='otherbuyer', email='other@urban.in', password='pass1234')
        self.product = Product.objects.create(name='Acoustic ANC Headphones', category='Electronics', price=Decimal('4999.00'))
        self.order = Order.objects.create(
            user=self.user,
            full_name='Aarav Sharma',
            email='buyer@urban.in',
            address='Flat 402, Lotus Towers',
            city='Bengaluru',
            postal_code='560001',
            total_amount=Decimal('5098.00'),
            payment_method='UPI',
            payment_status='Paid',
            order_status='Processing',
            transaction_id='TXN-INVOICE-TEST1',
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            price=self.product.price,
            quantity=1,
        )
        self.client = APIClient()

    def test_invoice_api_json_format(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get(f'/api/orders/{self.order.id}/invoice/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['order_id'], self.order.id)
        self.assertEqual(data['invoice_number'], f'INV-2026-{self.order.id:05d}')
        self.assertEqual(data['seller']['gstin'], '07AAACU1234F1Z8')
        self.assertEqual(data['buyer']['name'], 'Aarav Sharma')
        self.assertEqual(len(data['items']), 1)
        self.assertEqual(data['items'][0]['hsn_code'], '8518')
        self.assertIn('Rupees', data['amount_in_words'])
        self.assertEqual(data['tax_summary']['gst_rate_percent'], 18)

    def test_invoice_api_html_format(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get(f'/api/orders/{self.order.id}/invoice/?format=html')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/html', res['Content-Type'])
        content = res.content.decode('utf-8')
        self.assertIn('TAX INVOICE', content)
        self.assertIn(f'INV-2026-{self.order.id:05d}', content)
        self.assertIn('07AAACU1234F1Z8', content)
        self.assertIn('Acoustic ANC Headphones', content)

    def test_invoice_access_denied_for_other_user(self):
        self.client.force_authenticate(user=self.other_user)
        res = self.client.get(f'/api/orders/{self.order.id}/invoice/')
        self.assertEqual(res.status_code, 403)

    def test_amount_to_words_inr_utility(self):
        from .utils import amount_to_words_inr
        self.assertEqual(amount_to_words_inr(Decimal('0')), 'Zero Rupees Only')
        self.assertEqual(amount_to_words_inr(Decimal('100.00')), 'One Hundred Rupees Only')
        words = amount_to_words_inr(Decimal('5098.50'))
        self.assertIn('Five Thousand Ninety-Eight Rupees', words)
        self.assertIn('Fifty Paise Only', words)


class SellerAndDeliveryAgentCrudTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='adminuser2',
            email='adminuser2@example.com',
            password='Password123!',
        )
        self.customer = User.objects.create_user(
            username='regcustomer',
            email='customer2@example.com',
            password='Password123!',
        )
        self.product = Product.objects.create(
            name='Urban Pro Tech Tee',
            category='Clothing',
            price=Decimal('999.00'),
            stock=20,
        )

    def test_seller_crud_endpoints(self):
        # 1. Non-staff blocked
        self.client.force_authenticate(user=self.customer)
        unauth_res = self.client.post('/api/admin/sellers/', {'name': 'Unauthorized Store'}, format='json')
        self.assertEqual(unauth_res.status_code, 403)

        # 2. Staff creates seller (INSERT)
        self.client.force_authenticate(user=self.admin_user)
        create_res = self.client.post('/api/admin/sellers/', {
            'name': 'Titan Trendz Wholesale',
            'contact_person': 'Amit Shah',
            'email': 'amit@titantrendz.in',
            'phone': '+91 99887 66554',
            'city': 'Surat',
            'state': 'Gujarat',
            'gst_number': '24AAACT1234A1Z1',
            'rating': '4.9',
            'is_active': True,
        }, format='json')
        self.assertEqual(create_res.status_code, 201)
        seller_id = create_res.data['seller']['id']
        self.assertEqual(create_res.data['seller']['name'], 'Titan Trendz Wholesale')

        # 3. List sellers (READ)
        list_res = self.client.get('/api/admin/sellers/?search=Surat')
        self.assertEqual(list_res.status_code, 200)
        self.assertTrue(any(s['id'] == seller_id for s in list_res.data['sellers']))

        # 4. Update seller (UPDATE)
        patch_res = self.client.patch(f'/api/admin/sellers/{seller_id}/', {
            'phone': '+91 91122 33445',
            'city': 'Ahmedabad',
        }, format='json')
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.data['seller']['city'], 'Ahmedabad')
        self.assertEqual(patch_res.data['seller']['phone'], '+91 91122 33445')

        # 5. Assign seller to product
        prod_patch = self.client.patch(f'/api/admin/products/{self.product.id}/', {
            'seller_id': seller_id,
            'compare_at_price': '1499.00',
        }, format='json')
        self.assertEqual(prod_patch.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.seller_id, seller_id)
        self.assertEqual(self.product.compare_at_price, Decimal('1499.00'))

        # 6. Delete seller (DELETE)
        del_res = self.client.delete(f'/api/admin/sellers/{seller_id}/')
        self.assertEqual(del_res.status_code, 200)
        self.product.refresh_from_db()
        self.assertIsNone(self.product.seller)

    def test_delivery_agent_crud_endpoints(self):
        self.client.force_authenticate(user=self.admin_user)

        # 1. Create delivery agent (INSERT)
        create_res = self.client.post('/api/admin/delivery-agents/', {
            'name': 'Deepak Verma',
            'phone': '+91 98700 11223',
            'vehicle_type': 'Electric Bike',
            'vehicle_number': 'DL 05 EV 9900',
            'city': 'Delhi',
            'assigned_area': 'East Delhi',
            'status': 'Available',
            'rating': '4.9',
        }, format='json')
        self.assertEqual(create_res.status_code, 201)
        agent_id = create_res.data['delivery_agent']['id']
        self.assertEqual(create_res.data['delivery_agent']['name'], 'Deepak Verma')

        # 2. List agents (READ)
        list_res = self.client.get('/api/admin/delivery-agents/?search=Deepak')
        self.assertEqual(list_res.status_code, 200)
        self.assertTrue(any(a['id'] == agent_id for a in list_res.data['delivery_agents']))

        # 3. Update agent status & vehicle (UPDATE)
        patch_res = self.client.patch(f'/api/admin/delivery-agents/{agent_id}/', {
            'status': 'Out for Delivery',
            'vehicle_type': 'Bike',
        }, format='json')
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.data['delivery_agent']['status'], 'Out for Delivery')
        self.assertEqual(patch_res.data['delivery_agent']['vehicle_type'], 'Bike')

        # 4. Assign agent to an order
        order = Order.objects.create(
            user=self.customer,
            full_name='Test Buyer',
            email='buyer2@example.com',
            address='Street 1',
            city='Delhi',
            postal_code='110001',
            total_amount=Decimal('999.00'),
            payment_status='Paid',
            order_status='Processing',
        )
        ord_patch = self.client.patch(f'/api/admin/orders/{order.id}/', {
            'delivery_agent_id': agent_id,
            'order_status': 'Shipped',
        }, format='json')
        self.assertEqual(ord_patch.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.delivery_agent_id, agent_id)
        self.assertEqual(ord_patch.data['order']['delivery_agent_name'], 'Deepak Verma')

        # 5. Delete agent (DELETE)
        del_res = self.client.delete(f'/api/admin/delivery-agents/{agent_id}/')
        self.assertEqual(del_res.status_code, 200)
        order.refresh_from_db()
        self.assertIsNone(order.delivery_agent)




