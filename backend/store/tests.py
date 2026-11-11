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

