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
