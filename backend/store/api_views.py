import os
import uuid
import random
import re
from decimal import Decimal, InvalidOperation
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q, Sum
from django.utils import timezone
from django.utils.text import slugify
from django.http import HttpResponse
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, renderer_classes, action
from rest_framework.renderers import JSONRenderer, StaticHTMLRenderer
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import viewsets

from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress, EmailOTP, SupportTicket, ProductReview
from .serializers import (
    CategorySerializer, ProductSerializer, CartItemSerializer, 
    OrderSerializer, OrderItemSerializer, ShippingAddressSerializer, UserSerializer, SupportTicketSerializer, ProductReviewSerializer
)
from .utils import (
    send_email, send_otp_email, send_order_status_email, send_ticket_update_email,
    generate_tax_invoice_html, amount_to_words_inr
)

HOME_CACHE_KEY = 'urbancart_home_payload_v2'


def _invalidate_home_cache():
    cache.delete(HOME_CACHE_KEY)


def _get_admin_emails():
    raw = os.environ.get('ADMIN_EMAILS', '')
    return {e.strip().lower() for e in raw.split(',') if e.strip()}

# --- PRODUCT & CATEGORY VIEWSETS ---

def _build_sections_payload(all_products):
    serialized = ProductSerializer(all_products, many=True).data
    featured = [p for p in serialized if p.get('is_featured')]
    spotlight = featured[:6] if len(featured) >= 3 else serialized[:6]
    deals = sorted(
        serialized,
        key=lambda p: (float(p.get('rating') or 0), int(p.get('discount_percent') or 0), 1 if p.get('is_featured') else 0),
        reverse=True,
    )[:10]
    suggested = sorted(serialized, key=lambda p: int(p.get('id') or 0))[:10]
    return {
        'spotlight': spotlight,
        'deals': deals,
        'suggested': suggested,
        'total_count': len(serialized),
        'products': serialized,
    }


def _get_home_payload():
    payload = cache.get(HOME_CACHE_KEY)
    if payload is None:
        all_products = list(Product.objects.all().order_by('-created_at'))
        payload = _build_sections_payload(all_products)
        cache.set(HOME_CACHE_KEY, payload, timeout=180)
    return payload


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Product.objects.order_by('-created_at')
        cat = self.request.query_params.get('category')
        q = self.request.query_params.get('q')
        featured = self.request.query_params.get('featured')

        if cat and cat.lower() != 'all':
            qs = qs.filter(category__iexact=cat)
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q) | Q(category__icontains=q))
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        return qs

    def list(self, request, *args, **kwargs):
        resp = super().list(request, *args, **kwargs)
        resp['Cache-Control'] = 'public, max-age=180, stale-while-revalidate=600'
        return resp

    @action(detail=False, methods=['get'])
    def sections(self, request):
        payload = dict(_get_home_payload())
        payload.pop('products', None)
        resp = Response(payload)
        resp['Cache-Control'] = 'public, max-age=180, stale-while-revalidate=600'
        return resp

    @action(detail=False, methods=['get'])
    def home(self, request):
        """Combined single-roundtrip endpoint for HomePage (sections + catalog)."""
        resp = Response(_get_home_payload())
        resp['Cache-Control'] = 'public, max-age=180, stale-while-revalidate=600'
        return resp


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


# --- AUTHENTICATION APIS (TOKEN & OTP) ---

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_email_otp_api(request):
    """
    POST /api/auth/send-otp/
    Payload: { "email": "user@example.com" }
    """
    email = request.data.get('email', '').strip().lower()
    if not email or '@' not in email or '.' not in email:
        return Response({'error': 'Please provide a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)

    otp = f"{random.randint(100000, 999999)}"
    EmailOTP.objects.filter(email=email, is_verified=False).delete()
    EmailOTP.objects.create(email=email, otp=otp)

    email_sent, error_msg = send_otp_email(email, otp)
    if error_msg:
        print(f"[UrbanCart Email Error] {error_msg}")
    print(f"[UrbanCart OTP API Log] Generated OTP for {email}: {otp} (Sent: {email_sent})")

    if not email_sent:
        return Response({
            'status': 'error',
            'error': error_msg or 'Could not deliver OTP email. Please configure EMAIL_WEBHOOK_URL or BREVO_API_KEY on Render.',
            'email': email,
            'email_sent': False,
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    return Response({
        'status': 'success',
        'message': f'Verification code sent to {email}. Please check your inbox.',
        'email': email,
        'email_sent': True,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_email_otp_api(request):
    """
    POST /api/auth/verify-otp/
    Payload: { "email": "user@example.com", "otp": "123456" }
    """
    email = request.data.get('email', '').strip().lower()
    otp = request.data.get('otp', '').strip()

    if not email or not otp:
        return Response({'error': 'Email and 6-digit OTP code are required.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_record = EmailOTP.objects.filter(email=email, otp=otp, is_verified=False).order_by('-created_at').first()
    if not otp_record or otp_record.is_expired():
        return Response({'error': 'Invalid or expired OTP code. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    otp_record.is_verified = True
    otp_record.save()

    # Find or create user
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        base_username = email.split('@')[0]
        cleaned_username = ''.join(c for c in base_username if c.isalnum() or c in '_-')[:20] or 'user'
        candidate_username = cleaned_username
        counter = 1
        while User.objects.filter(username=candidate_username).exists():
            candidate_username = f"{cleaned_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            username=candidate_username,
            email=email,
            first_name=cleaned_username.capitalize()
        )
        user.set_unusable_password()
        user.save()

    if email in _get_admin_emails() and (not user.is_staff or not user.is_superuser):
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=['is_staff', 'is_superuser'])

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'status': 'success',
        'token': token.key,
        'user': UserSerializer(user).data,
        'message': f'Welcome back, {user.first_name or user.username}!'
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_auth_api(request):
    """
    POST /api/auth/google/
    Payload: { "email": "...", "name": "..." }
    """
    email = request.data.get('email', '').strip().lower()
    name = request.data.get('name', '').strip()

    if not email:
        return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if (user and (user.is_staff or user.is_superuser)) or email in _get_admin_emails():
        return Response(
            {'error': 'Admin accounts must sign in using Password Login or verified Email OTP.'},
            status=status.HTTP_403_FORBIDDEN
        )
    if not user:
        base_username = email.split('@')[0]
        cleaned_username = ''.join(c for c in base_username if c.isalnum() or c in '_-')[:20] or 'google_user'
        candidate_username = cleaned_username
        counter = 1
        while User.objects.filter(username=candidate_username).exists():
            candidate_username = f"{cleaned_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            username=candidate_username,
            email=email,
            first_name=name.split()[0] if name else cleaned_username.capitalize(),
            last_name=" ".join(name.split()[1:]) if len(name.split()) > 1 else ""
        )
        user.set_unusable_password()
        user.save()

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'status': 'success',
        'token': token.key,
        'user': UserSerializer(user).data,
        'message': f'Signed in with Google! Welcome back, {user.first_name or user.username}!'
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_api(request):
    """
    POST /api/auth/login/
    Payload: { "username": "...", "password": "..." }
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Allow login with email as username as well
    if '@' in username:
        user_obj = User.objects.filter(email__iexact=username).first()
        if user_obj:
            username = user_obj.username

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials. Please verify your username and password.'}, status=status.HTTP_400_BAD_REQUEST)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'status': 'success',
        'token': token.key,
        'user': UserSerializer(user).data,
        'message': f'Welcome back, {user.first_name or user.username}!'
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_api(request):
    """
    POST /api/auth/register/
    Payload: { "username": "...", "email": "...", "password": "...", "full_name": "..." }
    """
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    full_name = request.data.get('full_name', '').strip()

    if not email:
        return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not username and email:
        base_username = ''.join(c for c in email.split('@')[0] if c.isalnum() or c in '_-')[:20] or 'user'
        candidate = base_username
        counter = 1
        while User.objects.filter(username=candidate).exists():
            candidate = f"{base_username}_{counter}"
            counter += 1
        username = candidate

    if User.objects.filter(username=username).exists():
        return Response({'error': 'A user with this username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    if email and User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'An account with this email address already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    first_name = full_name.split()[0] if full_name else username
    last_name = " ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ""

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'status': 'success',
        'token': token.key,
        'user': UserSerializer(user).data,
        'message': f'Account created! Welcome to UrbanCart, {user.first_name}!'
    })


@api_view(['GET', 'PUT'])
def user_profile_api(request):
    """
    GET /api/auth/me/
    PUT /api/auth/me/
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'PUT':
        first_name = request.data.get('first_name', request.user.first_name)
        last_name = request.data.get('last_name', request.user.last_name)
        email = request.data.get('email', request.user.email)

        request.user.first_name = first_name
        request.user.last_name = last_name
        if email:
            request.user.email = email
        request.user.save()

    return Response({
        'user': UserSerializer(request.user).data
    })


@api_view(['POST'])
def logout_api(request):
    if request.user.is_authenticated:
        Token.objects.filter(user=request.user).delete()
    return Response({'status': 'success', 'message': 'Successfully logged out.'})


# --- CART APIS ---

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def cart_list_api(request):
    """
    GET /api/cart/
    Returns all cart items, total quantity, subtotal, shipping, grand total.
    """
    cart_items = CartItem.objects.all().order_by('created_at')
    serializer = CartItemSerializer(cart_items, many=True)
    subtotal = sum(item.get_total_price() for item in cart_items)
    shipping = Decimal('99.00') if subtotal > Decimal('0.00') else Decimal('0.00')
    grand_total = subtotal + shipping

    return Response({
        'items': serializer.data,
        'count': sum(item.quantity for item in cart_items),
        'subtotal': str(subtotal),
        'shipping': str(shipping),
        'grand_total': str(grand_total)
    })


@api_view(['POST'])
def cart_add_api(request):
    """
    POST /api/cart/add/
    Payload: { "product_id": 1, "quantity": 1 }
    Requires login
    """
    if not request.user.is_authenticated:
        return Response({
            'status': 'auth_required',
            'error': 'Please sign in to add items to your cart.'
        }, status=status.HTTP_401_UNAUTHORIZED)

    product_id = request.data.get('product_id')
    qty = int(request.data.get('quantity', 1))

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    cart_item, created = CartItem.objects.get_or_create(product=product)
    if not created:
        cart_item.quantity += qty
        cart_item.save()
    elif qty > 1:
        cart_item.quantity = qty
        cart_item.save()

    cart_items = CartItem.objects.all()
    subtotal = sum(item.get_total_price() for item in cart_items)
    shipping = Decimal('99.00') if subtotal > Decimal('0.00') else Decimal('0.00')

    return Response({
        'status': 'success',
        'message': f'Added {product.name} to cart!',
        'count': sum(item.quantity for item in cart_items),
        'subtotal': str(subtotal),
        'grand_total': str(subtotal + shipping),
        'item': CartItemSerializer(cart_item).data
    })


@api_view(['POST'])
def cart_update_api(request):
    """
    POST /api/cart/update/
    Payload: { "item_id": 1, "quantity": 2 } or { "item_id": 1, "delta": 1 }
    """
    item_id = request.data.get('item_id')
    try:
        cart_item = CartItem.objects.get(id=item_id)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

    if 'delta' in request.data:
        delta = int(request.data.get('delta', 0))
        cart_item.quantity += delta
    elif 'quantity' in request.data:
        cart_item.quantity = int(request.data.get('quantity', 1))

    if cart_item.quantity <= 0:
        cart_item.delete()
    else:
        cart_item.save()

    cart_items = CartItem.objects.all()
    subtotal = sum(item.get_total_price() for item in cart_items)
    shipping = Decimal('99.00') if subtotal > Decimal('0.00') else Decimal('0.00')

    return Response({
        'status': 'success',
        'count': sum(item.quantity for item in cart_items),
        'subtotal': str(subtotal),
        'grand_total': str(subtotal + shipping)
    })


@api_view(['DELETE'])
def cart_remove_api(request, item_id):
    """
    DELETE /api/cart/item/<item_id>/
    """
    CartItem.objects.filter(id=item_id).delete()
    cart_items = CartItem.objects.all()
    subtotal = sum(item.get_total_price() for item in cart_items)
    shipping = Decimal('99.00') if subtotal > Decimal('0.00') else Decimal('0.00')

    return Response({
        'status': 'success',
        'count': sum(item.quantity for item in cart_items),
        'subtotal': str(subtotal),
        'grand_total': str(subtotal + shipping)
    })


@api_view(['POST'])
def cart_clear_api(request):
    CartItem.objects.all().delete()
    return Response({'status': 'success', 'count': 0, 'subtotal': '0.00', 'grand_total': '0.00'})


# --- CHECKOUT & ORDERS APIS ---

@api_view(['POST'])
def checkout_api(request):
    """
    POST /api/checkout/
    Payload: {
        full_name, email, address, city, postal_code, payment_method
    }
    """
    cart_items = CartItem.objects.all()
    if not cart_items.exists():
        return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

    full_name = request.data.get('full_name')
    email = request.data.get('email')
    address = request.data.get('address')
    city = request.data.get('city')
    postal_code = request.data.get('postal_code')
    payment_method = request.data.get('payment_method', 'CARD')

    if not all([full_name, email, address, city, postal_code]):
        return Response({'error': 'All address and contact fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

    subtotal = sum(item.get_total_price() for item in cart_items)
    shipping = Decimal('99.00')
    grand_total = subtotal + shipping

    transaction_id = f"PAY-INR-{uuid.uuid4().hex[:8].upper()}"

    order = Order.objects.create(
        user=request.user if request.user.is_authenticated else None,
        full_name=full_name,
        email=email,
        address=address,
        city=city,
        postal_code=postal_code,
        total_amount=grand_total,
        payment_method=payment_method,
        payment_status='Paid' if payment_method in ['CARD', 'UPI'] else 'Pending',
        order_status='Processing',
        transaction_id=transaction_id
    )

    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            price=item.product.price,
            quantity=item.quantity
        )

    # Save to user address book
    if request.user.is_authenticated and not ShippingAddress.objects.filter(user=request.user, street_address=address).exists():
        ShippingAddress.objects.create(
            user=request.user,
            full_name=full_name,
            street_address=address,
            city=city,
            postal_code=postal_code,
            is_default=not ShippingAddress.objects.filter(user=request.user).exists()
        )

    cart_items.delete()
    send_order_status_email(order, 'CONFIRMED')

    return Response({
        'status': 'success',
        'message': f'Order #{order.id} placed successfully!',
        'order': OrderSerializer(order).data
    })


@api_view(['GET'])
def user_orders_api(request):
    """
    GET /api/orders/my-orders/
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    orders = Order.objects.filter(user=request.user).prefetch_related('items__product').order_by('-created_at')
    active_orders = [o for o in orders if o.order_status not in ('Cancelled', 'Returned')]
    active_total = sum(order.total_amount for order in active_orders)
    return Response({
        'orders': OrderSerializer(orders, many=True).data,
        'total_spent': str(active_total),
        'reward_points': int(active_total // 10)
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def order_detail_api(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'order': OrderSerializer(order).data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@renderer_classes([JSONRenderer, StaticHTMLRenderer])
def order_invoice_api(request, order_id):
    """
    GET /api/orders/<order_id>/invoice/
    Returns official GST Tax Invoice data for an order.
    Query param ?format=html returns a full printable standalone HTML page.
    """
    order = Order.objects.filter(id=order_id).prefetch_related('items__product').first()
    if not order:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.is_authenticated and order.user_id:
        if order.user_id != request.user.id and not request.user.is_staff:
            return Response({'error': 'You do not have permission to view this invoice.'}, status=status.HTTP_403_FORBIDDEN)

    if request.query_params.get('format') == 'html' or request.query_params.get('view') == 'html':
        html_content = generate_tax_invoice_html(order)
        return HttpResponse(html_content, content_type='text/html; charset=utf-8')

    serialized_order = OrderSerializer(order).data
    subtotal = sum(item.get_total_price() for item in order.items.all())
    taxable_val = (subtotal / Decimal('1.18')).quantize(Decimal('0.01')) if subtotal > 0 else Decimal('0.00')
    gst_val = (subtotal - taxable_val).quantize(Decimal('0.01'))
    amount_words = amount_to_words_inr(order.total_amount)

    invoice_data = {
        'order_id': order.id,
        'invoice_number': order.invoice_number,
        'invoice_date': order.created_at.strftime('%d %B %Y') if order.created_at else '',
        'order': serialized_order,
        'items': serialized_order.get('items', []),
        'buyer': {
            'name': order.full_name or (order.user.get_full_name() if order.user else 'Valued Customer'),
            'email': order.email or (order.user.email if order.user else ''),
            'address': order.address,
            'city': order.city,
            'postal_code': order.postal_code,
        },
        'seller': {
            'company_name': 'UrbanCart Retail Private Limited',
            'gstin': '07AAACU1234F1Z8',
            'cin': 'U52100HR2026PTC109988',
            'address': 'DLF Cyber City, Building 10, DLF Phase 2, Gurugram, Haryana - 122002',
            'support_email': 'care@urbancart.in',
            'support_phone': '+91 1800-URBANCART',
        },
        'tax_summary': {
            'subtotal': str(subtotal),
            'taxable_amount': str(taxable_val),
            'gst_amount': str(gst_val),
            'gst_rate': '18% Inclusive',
            'gst_rate_percent': 18,
            'shipping': str(max(Decimal('0.00'), order.total_amount - subtotal)),
            'total_amount': str(order.total_amount),
            'amount_in_words': amount_words,
        },
        'amount_in_words': amount_words,
        'html_url': f"/api/orders/{order.id}/invoice/?format=html",
    }
    return Response(invoice_data)


@api_view(['POST'])
def cancel_order_api(request, order_id):
    """
    POST /api/orders/<order_id>/cancel/
    Payload: { reason }
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    order = Order.objects.filter(id=order_id, user=request.user).first()
    if not order:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status not in ('Processing', 'Shipped'):
        return Response({
            'error': f"Order #{order.id} is already '{order.order_status}' and cannot be cancelled directly. Use Return/Refund if it was delivered."
        }, status=status.HTTP_400_BAD_REQUEST)

    reason = (request.data.get('reason') or '').strip() or 'Cancelled by customer'
    order.order_status = 'Cancelled'
    order.cancel_reason = reason

    if order.payment_status == 'Paid':
        order.payment_status = 'Refund Initiated'
        order.refund_amount = order.total_amount
        order.refund_reference = f"REF-{uuid.uuid4().hex[:8].upper()}"
        reply_note = (
            f"Order #{order.id} cancelled successfully. Refund of ₹{order.refund_amount} has been "
            f"initiated to your {order.payment_method} source (Ref: {order.refund_reference}). "
            f"Amount reflects in 2–3 business days."
        )
        ticket_status = 'In Progress'
    else:
        order.refund_amount = Decimal('0.00')
        order.refund_reference = f"CXL-{uuid.uuid4().hex[:8].upper()}"
        reply_note = f"Order #{order.id} cancelled successfully ({order.payment_method}). No payment was deducted."
        ticket_status = 'Resolved'

    order.save()
    send_order_status_email(order, 'CANCELLED')

    SupportTicket.objects.create(
        user=request.user,
        order=order,
        issue_type='CANCEL',
        subject=f"Cancellation for Order #{order.id}",
        message=f"Reason: {reason}",
        admin_reply=reply_note,
        status=ticket_status,
    )

    return Response({
        'status': 'success',
        'message': reply_note,
        'order': OrderSerializer(order).data,
    })


@api_view(['POST'])
def return_order_api(request, order_id):
    """
    POST /api/orders/<order_id>/return/
    Payload: { reason, resolution: 'REFUND' | 'REPLACEMENT' }
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    order = Order.objects.filter(id=order_id, user=request.user).first()
    if not order:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if order.order_status != 'Delivered':
        return Response({
            'error': f"Return requests apply to Delivered orders (current status: {order.order_status}). You can cancel active orders directly."
        }, status=status.HTTP_400_BAD_REQUEST)

    if (timezone.now() - order.created_at).days > 7:
        return Response({'error': 'The 7-day return & replacement window has expired for this order.'}, status=status.HTTP_400_BAD_REQUEST)

    resolution = (request.data.get('resolution') or 'REFUND').strip().upper()
    if resolution not in ('REFUND', 'REPLACEMENT'):
        resolution = 'REFUND'
    reason = (request.data.get('reason') or '').strip() or 'Customer requested return'

    order.order_status = 'Return Requested'
    order.return_reason = f"[{resolution}] {reason}"

    if resolution == 'REFUND':
        order.refund_amount = order.total_amount
        order.refund_reference = f"RET-{uuid.uuid4().hex[:8].upper()}"
        if order.payment_status == 'Paid':
            order.payment_status = 'Refund Initiated'
            reply_note = (
                f"Return pickup scheduled within 24–48 hrs for Order #{order.id}. "
                f"Refund of ₹{order.refund_amount} initiated (Ref: {order.refund_reference}) once courier picks up the item."
            )
        else:
            reply_note = (
                f"Return pickup scheduled within 24–48 hrs for COD Order #{order.id} (Ref: {order.refund_reference}). "
                f"Instant UPI refund of ₹{order.refund_amount} will be issued at pickup."
            )
    else:
        order.refund_amount = Decimal('0.00')
        order.refund_reference = f"RPL-{uuid.uuid4().hex[:8].upper()}"
        reply_note = (
            f"Free replacement & reverse pickup scheduled within 24–48 hrs for Order #{order.id} "
            f"(Ref: {order.refund_reference})."
        )

    order.save()
    send_order_status_email(order, 'RETURN_REQUESTED')

    SupportTicket.objects.create(
        user=request.user,
        order=order,
        issue_type='RETURN',
        subject=f"{resolution.title()} Request for Order #{order.id}",
        message=reason,
        admin_reply=reply_note,
        status='In Progress',
    )

    return Response({
        'status': 'success',
        'message': reply_note,
        'order': OrderSerializer(order).data,
    })


# --- SHIPPING ADDRESS APIS ---

@api_view(['GET', 'POST'])
def user_addresses_api(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'POST':
        full_name = request.data.get('full_name', '').strip()
        street_address = request.data.get('street_address', '').strip()
        city = request.data.get('city', '').strip()
        state = request.data.get('state', 'State').strip()
        postal_code = request.data.get('postal_code', '').strip()
        is_default = bool(request.data.get('is_default', False))

        if is_default:
            ShippingAddress.objects.filter(user=request.user).update(is_default=False)

        addr = ShippingAddress.objects.create(
            user=request.user,
            full_name=full_name or request.user.get_full_name() or request.user.username,
            street_address=street_address,
            city=city,
            state=state,
            postal_code=postal_code,
            is_default=is_default or not ShippingAddress.objects.filter(user=request.user).exists()
        )
        return Response({'status': 'success', 'address': ShippingAddressSerializer(addr).data})

    addresses = ShippingAddress.objects.filter(user=request.user)
    return Response({'addresses': ShippingAddressSerializer(addresses, many=True).data})


@api_view(['DELETE'])
def delete_address_api(request, address_id):
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    ShippingAddress.objects.filter(id=address_id, user=request.user).delete()
    return Response({'status': 'success'})


# --- SUPPORT TICKETS & CHAT SUPPORT API ---

@api_view(['GET', 'POST'])
def support_tickets_api(request):
    """
    GET /api/support/tickets/  -> List authenticated user's support tickets
    POST /api/support/tickets/ -> Create a new support ticket
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'POST':
        subject = (request.data.get('subject') or '').strip()
        message = (request.data.get('message') or '').strip()
        issue_type = (request.data.get('issue_type') or 'OTHER').strip().upper()
        order_id = request.data.get('order_id')

        if issue_type not in dict(SupportTicket.ISSUE_CHOICES):
            issue_type = 'OTHER'

        if not subject or not message:
            return Response({'error': 'Subject and message are required.'}, status=status.HTTP_400_BAD_REQUEST)

        linked_order = None
        if order_id:
            linked_order = Order.objects.filter(id=order_id, user=request.user).first()

        user_name = request.user.first_name or request.user.username or 'Customer'
        order_label = f" regarding Order #{linked_order.id}" if linked_order else ""
        auto_reply = (
            f"Hi {user_name}, UrbanCart Priority Care has received your {issue_type.lower()} request"
            f"{order_label}. A support specialist will update you here within 2–4 hours."
        )

        ticket = SupportTicket.objects.create(
            user=request.user,
            order=linked_order,
            issue_type=issue_type,
            subject=subject[:200],
            message=message,
            admin_reply=auto_reply,
            status='Open',
        )
        return Response({
            'status': 'success',
            'message': f'Support Ticket #{ticket.id} created!',
            'ticket': SupportTicketSerializer(ticket).data,
        }, status=status.HTTP_201_CREATED)

    tickets = SupportTicket.objects.filter(user=request.user).order_by('-created_at')
    return Response({'tickets': SupportTicketSerializer(tickets, many=True).data})


# --- AI CHATBOT & CUSTOMER SUPPORT API ---

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def ai_chatbot_api(request):
    message = request.data.get('message', '').strip()
    if not message:
        return Response({
            'reply': "Hey there! 👋 I'm your UrbanCart AI & Care Assistant. Ask me to find products, track orders, cancel/return an order, check refund status, or connect to Support!",
            'products': []
        })

    msg_lower = message.lower()
    suggested_products = []

    def _find_target_order():
        match = re.search(r'(?:#|order\s*(?:id\s*)?)(\d+)', msg_lower)
        if match:
            oid = int(match.group(1))
            if request.user.is_authenticated:
                found = Order.objects.filter(id=oid, user=request.user).first()
                if found:
                    return found
            return Order.objects.filter(id=oid).first()
        if request.user.is_authenticated:
            return Order.objects.filter(user=request.user).order_by('-created_at').first()
        return None

    # 1. CANCEL, RETURN, REFUND & CUSTOMER CARE SUPPORT
    if any(k in msg_lower for k in [
        'return', 'refund', 'exchange', 'replace', 'wapas', 'cancel', 'paisa', 'paise',
        'support', 'agent', 'human', 'customer care', 'complaint', 'help desk', 'issue', 'problem', 'madad', 'talk to'
    ]):
        target_order = _find_target_order()

        if any(k in msg_lower for k in ['support', 'agent', 'human', 'customer care', 'complaint', 'help desk', 'madad', 'talk to']):
            reply = (
                "🎧 **UrbanCart Priority Chat Support:**\n\n"
                "• **Live Ticket Desk:** Tap **Raise Support Ticket** below to send your issue directly to our care team (2–4 hr SLA).\n"
                "• **Self-Service Cancel / Return:** Go to **Dashboard ➔ Order History** for instant 1-click cancellation & 7-day returns.\n"
                "• **Email Care:** urbancart.care@support.in"
            )
            return Response({'reply': reply, 'products': [], 'action': 'open_support'})

        if target_order:
            if target_order.order_status in ('Cancelled', 'Return Requested', 'Returned'):
                refund_line = (
                    f"• **Refund Status:** {target_order.payment_status} — ₹{target_order.refund_amount or target_order.total_amount}\n"
                    f"• **Reference ID:** {target_order.refund_reference or 'Processing'}"
                )
                reply = (
                    f"🔄 **Order #{target_order.id} ({target_order.order_status})**\n\n"
                    f"{refund_line}\n"
                    f"• **Timeline:** Refunds settle in **2–3 business days** to your original payment method."
                )
                return Response({'reply': reply, 'products': [], 'action': 'open_orders'})

            eligibility = (
                "Eligible for **Instant 1-Click Cancel**"
                if target_order.order_status in ('Processing', 'Shipped')
                else "Eligible for **7-Day Free Return / Replacement**"
            )
            reply = (
                f"📦 **Order #{target_order.id} Cancel / Return Help:**\n\n"
                f"• **Current Status:** {target_order.order_status}\n"
                f"• **Eligibility:** {eligibility}\n"
                f"• **Order Value:** ₹{target_order.total_amount} ({target_order.payment_status})\n\n"
                "Tap **Manage Orders** below to cancel or schedule a doorstep return pickup immediately!"
            )
            return Response({'reply': reply, 'products': [], 'action': 'open_orders'})

        reply = (
            "🔄 **UrbanCart Cancel, Return & Instant Refund Policy:**\n\n"
            "• **Instant Cancel:** Processing / Shipped orders can be cancelled in 1 click from **Dashboard ➔ Orders**.\n"
            "• **7-Day Hassle-Free Return:** Free reverse doorstep pickup within 7 days of delivery.\n"
            "• **Fast Refunds:** Automatic refund to original UPI / Card within **2–3 business days** with tracking Ref ID."
        )
        return Response({'reply': reply, 'products': [], 'action': 'open_orders'})

    # 2. ORDER TRACKING & SHIPMENT
    if any(k in msg_lower for k in ['order', 'track', 'status', 'kaha hai', 'kahan', 'parcel', 'delivery kab', 'dispatch']):
        target_order = _find_target_order()

        if target_order:
            status_emoji = '🚚' if target_order.order_status == 'Shipped' else ('🎉' if target_order.order_status == 'Delivered' else '📦')
            refund_extra = (
                f"\n• **Refund Ref:** {target_order.refund_reference} (₹{target_order.refund_amount})"
                if target_order.refund_reference else ""
            )
            reply = (
                f"{status_emoji} **Order #{target_order.id} Status:**\n\n"
                f"• **Current Stage:** {target_order.order_status}\n"
                f"• **Total Amount:** ₹{target_order.total_amount}\n"
                f"• **Payment:** {target_order.payment_status} ({target_order.get_payment_method_display()})\n"
                f"• **Destination:** {target_order.city} ({target_order.postal_code})\n"
                f"• **Estimated Delivery:** 2 to 3 business days via Express Courier."
                f"{refund_extra}"
            )
            return Response({'reply': reply, 'products': [], 'action': 'open_orders'})
        elif not request.user.is_authenticated:
            reply = "To track your orders instantly, please sign in with OTP or tell me your specific Order ID (e.g. 'Track order #1')."
            return Response({'reply': reply, 'products': []})
        else:
            reply = "You haven't placed any orders yet. Here are our top trending drops:"
            products = Product.objects.filter(is_featured=True)[:3]
            for p in products:
                suggested_products.append(ProductSerializer(p).data)
            return Response({'reply': reply, 'products': suggested_products})

    # 3. URBANCOINS & LOYALTY
    if any(k in msg_lower for k in ['coin', 'reward', 'points', 'loyalty', 'cashback', 'urbancoin', 'coupon']):
        reply = (
            "🪙 **UrbanCoins VIP Rewards Program:**\n\n"
            "• **Earn 10% Back:** 1 UrbanCoin for every ₹10 spent on any purchase.\n"
            "• **Direct Value:** 1 UrbanCoin = ₹1 INR cash discount!\n"
            "• **Auto-Applied:** Coins automatically discount your total during checkout.\n"
            "• **Never Expires:** Your coins stay active indefinitely in your wallet!"
        )
        return Response({'reply': reply, 'products': []})

    # 4. SHIPPING & PAYMENT
    if any(k in msg_lower for k in ['shipping', 'delivery charge', 'charges kitna', 'kab aayega', 'cod', 'payment method', 'free delivery']):
        reply = (
            "⚡ **Shipping & Payment Options:**\n\n"
            "• **Express Delivery:** Pan-India delivery within 2 to 4 business days.\n"
            "• **Flat Fee:** Express shipping is ₹99.\n"
            "• **Payment Modes:** UPI (GPay, PhonePe, Paytm), Cards (Visa/Mastercard/RuPay), and Cash on Delivery (COD) are all supported!"
        )
        return Response({'reply': reply, 'products': []})

    # 5. GREETING & CASUAL CONVERSATION
    user_name = request.user.first_name or request.user.username if request.user.is_authenticated else ""
    name_str = f" {user_name}" if user_name else ""

    # Morning
    if any(k in msg_lower for k in ['good morning', 'good mornig', 'good morn', 'gm', 'subah bakhair', 'shubh prabhat']):
        reply = (
            f"Good morning{name_str}! ☀️ Wishing you a wonderful and stylish day ahead!\n\n"
            "How can I assist your shopping today? You can ask me to:\n"
            "• Find trending hoodies, sneakers, or gadgets 👟\n"
            "• Search within your budget (e.g. *'shoes under 4000'*)\n"
            "• Track existing orders or check UrbanCoins rewards ⚡"
        )
        return Response({'reply': reply, 'products': []})

    # Afternoon / Evening / Night
    if any(k in msg_lower for k in ['good afternoon', 'ga', 'shubh dopahar']):
        reply = f"Good afternoon{name_str}! 🌤️ Welcome to UrbanCart AI! How can I help you discover something fresh today?"
        return Response({'reply': reply, 'products': []})

    if any(k in msg_lower for k in ['good evening', 'ge', 'shubh sandhya']):
        reply = f"Good evening{name_str}! 🌆 Looking for tonight's trending drops or need help with an order? Just ask!"
        return Response({'reply': reply, 'products': []})

    if any(k in msg_lower for k in ['good night', 'gn', 'shubh ratri']):
        reply = f"Good night{name_str}! 🌙 Sleep tight! Feel free to bookmark your favorite drops or ask anything before you go."
        return Response({'reply': reply, 'products': []})

    # How are you / Kya haal hai
    if any(k in msg_lower for k in ['how are you', 'how r u', 'kaise ho', 'kaisa hai', 'kya haal', 'sab badhiya']):
        reply = (
            f"I'm doing great, thank you for asking{name_str}! 😊\n\n"
            "Ready and energized to help you browse the best streetwear fashion, footwear, and tech accessories on UrbanCart. What are you looking to buy today?"
        )
        return Response({'reply': reply, 'products': []})

    # Thank you / Shukriya
    if any(k in msg_lower for k in ['thank', 'thanks', 'thx', 'shukriya', 'dhanyawad', 'dhanyavad']):
        reply = f"You're very welcome{name_str}! 😊 Always glad to help. Let me know whenever you need anything else. Happy shopping! 🛍️"
        return Response({'reply': reply, 'products': []})

    # Standard Hi/Hello
    if any(msg_lower.strip().startswith(g) for g in ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'bhai', 'bro', 'hola', 'yo', 'sup', 'wassup']) and len(msg_lower.split()) <= 4:
        reply = (
            f"Hey{name_str}! 👋 Welcome to UrbanCart AI!\n\n"
            "I'm your personal shopping assistant. Ask me to:\n"
            "• Find Hoodies, Sneakers, or Tech Gear 👟\n"
            "• Filter by budget (e.g. *'shoes under 5000'*)\n"
            "• Track your active orders 📦\n"
            "• Check UrbanCoins rewards & delivery details ⚡"
        )
        return Response({'reply': reply, 'products': []})

    # 6. PRODUCT SEARCH & RECOMMENDATION
    max_price = None
    price_match = re.search(r'(?:under|below|less than|within|ke andar|upto|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+)', msg_lower)
    if price_match:
        try:
            max_price = int(price_match.group(1))
        except ValueError:
            pass

    qs = Product.objects.all()

    category_target = None
    if any(w in msg_lower for w in ['hoodie', 'hoodies', 'streetwear', 'jacket', 'shirt', 'clothing', 'apparel', 't-shirt', 'tshirt', 'sweatshirt']):
        category_target = 'Clothing'
    elif any(w in msg_lower for w in ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'boot', 'boots', 'runner', 'runners']):
        category_target = 'Footwear'
    elif any(w in msg_lower for w in ['headphone', 'headphones', 'earbud', 'earbuds', 'audio', 'sound', 'speaker', 'anc']):
        category_target = 'Electronics'
    elif any(w in msg_lower for w in ['watch', 'smartwatch', 'smart watch', 'wearable', 'fitness']):
        category_target = 'Wearables'
    elif any(w in msg_lower for w in ['keyboard', 'gaming', 'mechanical', 'mouse', 'rgb']):
        category_target = 'Gaming'

    if category_target:
        qs = qs.filter(category__iexact=category_target)

    if max_price:
        qs = qs.filter(price__lte=max_price)

    stop_words = [
        'show', 'me', 'the', 'under', 'below', 'bhai', 'kuch', 'accha', 'best', 'for', 'a', 'an', 
        'in', 'and', 'chahiye', 'dikhao', 'dikhana', 'recommend', 'suggest', 'good', 'morning', 
        'mornig', 'evening', 'night', 'today', 'please', 'pls', 'can', 'you', 'help', 'find', 
        'want', 'i', 'need', 'buy', 'looking', 'item', 'items', 'product', 'products'
    ]
    search_terms = [w for w in msg_lower.split() if w not in stop_words and len(w) > 2]

    if not category_target and not search_terms and not max_price:
        return Response({
            'reply': "I'm ready to help you shop! You can ask me to find hoodies, sneakers, gadgets, or track your orders.",
            'products': []
        })

    if search_terms and not category_target:
        q_obj = Q()
        for term in search_terms:
            q_obj |= Q(name__icontains=term) | Q(category__icontains=term) | Q(description__icontains=term)
        qs = qs.filter(q_obj)

    matched = list(qs.order_by('-rating', '-created_at')[:4])
    if matched:
        reply = "🔥 Here are the top recommended items from our catalog:"
        for p in matched:
            suggested_products.append(ProductSerializer(p).data)
    else:
        fallback = Product.objects.filter(is_featured=True)[:3]
        reply = f"I couldn't find exact matches for '{message}', but check out these trending bestsellers:"
        for p in fallback:
            suggested_products.append(ProductSerializer(p).data)

    return Response({'reply': reply, 'products': suggested_products})


# --- ADMIN CONTROL CENTER APIS (STAFF ONLY) ---

@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_overview_api(request):
    """GET /api/admin/overview/ -> Aggregated metrics, orders, products & tickets for staff."""
    orders_qs = Order.objects.select_related('user').prefetch_related('items__product').order_by('-created_at')
    products_qs = Product.objects.order_by('-created_at')
    tickets_qs = SupportTicket.objects.select_related('user', 'order').order_by('-created_at')

    gross_revenue = orders_qs.exclude(order_status='Cancelled').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
    refund_total = orders_qs.filter(payment_status__in=['Refund Initiated', 'Refunded']).aggregate(total=Sum('refund_amount'))['total'] or Decimal('0.00')

    stats = {
        'total_orders': orders_qs.count(),
        'pending_orders': orders_qs.filter(order_status__in=['Processing', 'Shipped', 'Return Requested']).count(),
        'active_tickets': tickets_qs.exclude(status='Resolved').count(),
        'total_products': products_qs.count(),
        'low_stock_products': products_qs.filter(stock__lte=5).count(),
        'total_customers': User.objects.filter(is_staff=False).count(),
        'gross_revenue': str(gross_revenue),
        'refund_total': str(refund_total),
    }

    categories = list(products_qs.values_list('category', flat=True).distinct())

    return Response({
        'stats': stats,
        'orders': OrderSerializer(orders_qs[:100], many=True).data,
        'products': ProductSerializer(products_qs, many=True).data,
        'tickets': SupportTicketSerializer(tickets_qs[:100], many=True).data,
        'categories': categories,
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAdminUser])
def admin_update_order_api(request, order_id):
    """PATCH /api/admin/orders/<id>/ -> Update order fulfillment status and payment/refund state."""
    order = Order.objects.filter(id=order_id).first()
    if not order:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    old_order_status = order.order_status
    old_payment_status = order.payment_status

    new_order_status = request.data.get('order_status')
    new_payment_status = request.data.get('payment_status')
    refund_amount = request.data.get('refund_amount')
    refund_reference = request.data.get('refund_reference')

    valid_order_statuses = dict(Order.ORDER_STATUS_CHOICES)
    valid_payment_statuses = dict(Order.PAYMENT_STATUS_CHOICES)

    if new_order_status is not None:
        if new_order_status not in valid_order_statuses:
            return Response({'error': f'Invalid order_status: {new_order_status}'}, status=status.HTTP_400_BAD_REQUEST)
        order.order_status = new_order_status

    if new_payment_status is not None:
        if new_payment_status not in valid_payment_statuses:
            return Response({'error': f'Invalid payment_status: {new_payment_status}'}, status=status.HTTP_400_BAD_REQUEST)
        order.payment_status = new_payment_status

    if refund_amount is not None:
        try:
            order.refund_amount = Decimal(str(refund_amount))
        except (InvalidOperation, ValueError):
            return Response({'error': 'Invalid refund_amount.'}, status=status.HTTP_400_BAD_REQUEST)
    elif order.payment_status in ('Refund Initiated', 'Refunded') and (order.refund_amount is None or order.refund_amount <= 0):
        order.refund_amount = order.total_amount

    if refund_reference is not None:
        order.refund_reference = str(refund_reference)[:100]
    elif order.payment_status in ('Refund Initiated', 'Refunded') and not order.refund_reference:
        order.refund_reference = f"RFND-{order.id:05d}-{uuid.uuid4().hex[:6].upper()}"

    order.save()

    if new_order_status is not None and new_order_status != old_order_status:
        send_order_status_email(order, new_order_status.upper().replace(' ', '_'))
    elif new_payment_status == 'Refunded' and old_payment_status != 'Refunded':
        send_order_status_email(order, 'REFUNDED')

    return Response({
        'status': 'success',
        'message': f'Order #{order.id} updated to {order.order_status} ({order.payment_status}).',
        'order': OrderSerializer(order).data,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_create_product_api(request):
    """POST /api/admin/products/ -> Create a new catalog product."""
    name = (request.data.get('name') or '').strip()
    category = (request.data.get('category') or 'General').strip() or 'General'
    description = (request.data.get('description') or '').strip()
    image_url = (request.data.get('image_url') or '').strip() or None
    is_featured = bool(request.data.get('is_featured', False))

    if not name:
        return Response({'error': 'Product name is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        price = Decimal(str(request.data.get('price', '')))
        if price < 0:
            raise ValueError()
    except (InvalidOperation, ValueError):
        return Response({'error': 'Valid non-negative price is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        compare_raw = request.data.get('compare_at_price', 0)
        compare_at_price = Decimal(str(compare_raw or 0))
    except (InvalidOperation, ValueError):
        compare_at_price = Decimal('0')

    try:
        stock = max(0, int(request.data.get('stock', 10)))
    except (TypeError, ValueError):
        stock = 10

    cat_obj, _ = Category.objects.get_or_create(
        name=category,
        defaults={'slug': slugify(category)[:110] or f'cat-{uuid.uuid4().hex[:6]}'}
    )

    product = Product.objects.create(
        category_rel=cat_obj,
        category=category,
        name=name[:255],
        slug=f"{slugify(name)[:220]}-{uuid.uuid4().hex[:6]}",
        description=description,
        price=price,
        compare_at_price=compare_at_price,
        image_url=image_url,
        stock=stock,
        is_featured=is_featured,
    )
    _invalidate_home_cache()
    return Response({
        'status': 'success',
        'message': f'Product "{product.name}" created.',
        'product': ProductSerializer(product).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([permissions.IsAdminUser])
def admin_product_detail_api(request, product_id):
    """PATCH/DELETE /api/admin/products/<id>/ -> Update price/stock/featured or delete product."""
    product = Product.objects.filter(id=product_id).first()
    if not product:
        return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        product_name = product.name
        product.delete()
        _invalidate_home_cache()
        return Response({'status': 'success', 'message': f'Deleted "{product_name}".'})

    if 'name' in request.data and str(request.data['name']).strip():
        product.name = str(request.data['name']).strip()[:255]
    if 'category' in request.data and str(request.data['category']).strip():
        cat_name = str(request.data['category']).strip()[:100]
        cat_obj, _ = Category.objects.get_or_create(
            name=cat_name,
            defaults={'slug': slugify(cat_name)[:110] or f'cat-{uuid.uuid4().hex[:6]}'}
        )
        product.category = cat_name
        product.category_rel = cat_obj
    if 'description' in request.data:
        product.description = str(request.data['description'])
    if 'image_url' in request.data:
        product.image_url = str(request.data['image_url']).strip() or None
    if 'price' in request.data:
        try:
            price = Decimal(str(request.data['price']))
            if price < 0:
                raise ValueError()
            product.price = price
        except (InvalidOperation, ValueError):
            return Response({'error': 'Valid non-negative price is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if 'stock' in request.data:
        try:
            product.stock = max(0, int(request.data['stock']))
        except (TypeError, ValueError):
            return Response({'error': 'Valid stock integer is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if 'is_featured' in request.data:
        product.is_featured = bool(request.data['is_featured'])

    product.save()
    _invalidate_home_cache()
    return Response({
        'status': 'success',
        'message': f'Product "{product.name}" updated.',
        'product': ProductSerializer(product).data,
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAdminUser])
def admin_update_ticket_api(request, ticket_id):
    """PATCH /api/admin/tickets/<id>/ -> Reply to customer ticket and/or update status."""
    ticket = SupportTicket.objects.filter(id=ticket_id).first()
    if not ticket:
        return Response({'error': 'Support ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

    if 'status' in request.data:
        new_status = request.data['status']
        if new_status not in dict(SupportTicket.STATUS_CHOICES):
            return Response({'error': f'Invalid ticket status: {new_status}'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = new_status

    if 'admin_reply' in request.data:
        ticket.admin_reply = str(request.data['admin_reply']).strip()

    ticket.save()
    send_ticket_update_email(ticket)
    return Response({
        'status': 'success',
        'message': f'Ticket #{ticket.id} updated.',
        'ticket': SupportTicketSerializer(ticket).data,
    })


# --- PRODUCT REVIEWS & RATINGS API ---

@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def product_reviews_api(request, product_id):
    """
    GET  /api/products/<product_id>/reviews/ -> List all real reviews + rating breakdown + user review eligibility
    POST /api/products/<product_id>/reviews/ -> Submit or update review (strictly verified delivered buyers only)
    """
    product = Product.objects.filter(id=product_id).first()
    if not product:
        return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Please sign in to submit a review.'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            rating_val = int(request.data.get('rating'))
            if rating_val < 1 or rating_val > 5:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({'error': 'Rating must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        title = (request.data.get('title') or '').strip()[:120]
        comment = (request.data.get('comment') or '').strip()
        if len(comment) < 3:
            return Response({'error': 'Please write at least 3 characters in your review comment.'}, status=status.HTTP_400_BAD_REQUEST)

        # Strictly verify that user ordered this product AND it has been delivered
        user_orders = Order.objects.filter(
            user=request.user,
            items__product=product,
        )
        if not user_orders.exists():
            return Response({
                'error': 'Only customers who have ordered this product can write a review.',
                'code': 'not_purchased'
            }, status=status.HTTP_403_FORBIDDEN)

        delivered_order = user_orders.filter(order_status='Delivered').first()
        if not delivered_order:
            in_transit = user_orders.filter(order_status__in=['Processing', 'Shipped']).exists()
            if in_transit:
                return Response({
                    'error': 'Your order is currently in transit. You can write a review once it has been delivered!',
                    'code': 'delivery_pending'
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'error': 'Reviews are only allowed after your order has been successfully delivered.',
                'code': 'not_delivered'
            }, status=status.HTTP_400_BAD_REQUEST)

        review, created = ProductReview.objects.update_or_create(
            product=product,
            user=request.user,
            defaults={
                'rating': rating_val,
                'title': title,
                'comment': comment,
                'is_verified_purchase': True,
            },
        )
        product.recalculate_rating()
        _invalidate_home_cache()

        return Response({
            'status': 'success',
            'message': 'Review submitted!' if created else 'Your review was updated!',
            'review': ProductReviewSerializer(review, context={'request': request}).data,
            'average_rating': str(product.rating),
            'review_count': product.review_count,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    reviews_qs = ProductReview.objects.filter(product=product).select_related('user').order_by('-created_at')
    breakdown = {str(star): 0 for star in range(1, 6)}
    for r in reviews_qs:
        breakdown[str(r.rating)] = breakdown.get(str(r.rating), 0) + 1

    can_review = False
    review_status_reason = 'unauthenticated'
    user_review = None

    if request.user.is_authenticated:
        own = reviews_qs.filter(user=request.user).first()
        if own:
            user_review = ProductReviewSerializer(own, context={'request': request}).data

        user_orders = Order.objects.filter(user=request.user, items__product=product)
        if not user_orders.exists():
            can_review = False
            review_status_reason = 'not_purchased'
        elif user_orders.filter(order_status='Delivered').exists():
            can_review = True
            review_status_reason = 'eligible'
        elif user_orders.filter(order_status__in=['Processing', 'Shipped']).exists():
            can_review = False
            review_status_reason = 'delivery_pending'
        else:
            can_review = False
            review_status_reason = 'not_delivered'

    return Response({
        'product_id': product.id,
        'average_rating': str(product.rating),
        'review_count': product.review_count,
        'breakdown': breakdown,
        'can_review': can_review,
        'review_status_reason': review_status_reason,
        'user_review': user_review,
        'reviews': ProductReviewSerializer(reviews_qs, many=True, context={'request': request}).data,
    })


@api_view(['DELETE'])
def delete_product_review_api(request, product_id, review_id):
    """DELETE /api/products/<product_id>/reviews/<review_id>/ -> Delete own review or admin moderation."""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

    review = ProductReview.objects.select_related('product').filter(id=review_id, product_id=product_id).first()
    if not review:
        return Response({'error': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

    if review.user_id != request.user.id and not request.user.is_staff:
        return Response({'error': 'You can only delete your own review.'}, status=status.HTTP_403_FORBIDDEN)

    product = review.product
    review.delete()
    product.recalculate_rating()
    _invalidate_home_cache()

    return Response({
        'status': 'success',
        'message': 'Review deleted.',
        'average_rating': str(product.rating),
        'review_count': product.review_count,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def admin_test_email_api(request):
    """POST /api/admin/test-email/ -> Diagnostics utility for staff to test email delivery to ANY recipient."""
    recipient = (request.data.get('email') or '').strip().lower()
    if not recipient or '@' not in recipient:
        return Response({'error': 'Please provide a valid recipient email.'}, status=status.HTTP_400_BAD_REQUEST)

    subject = f"🧪 UrbanCart Email Test to {recipient}"
    plain = f"Hello,\n\nThis is an automated test email sent from UrbanCart Admin to verify live delivery to {recipient}.\n\nIf you see this, external delivery is working properly!"
    html = f"""<div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:12px;max-width:520px;background:#ffffff;">
        <h2 style="color:#d97706;margin-top:0;">🧪 UrbanCart Email Delivery Test</h2>
        <p style="color:#334155;">This message was triggered from your UrbanCart Admin Panel to test deliverability to: <strong>{recipient}</strong>.</p>
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:12px 16px;border-radius:8px;color:#065f46;font-weight:bold;margin:16px 0;">
            ✓ Delivery Pipeline Verified!
        </div>
        <p style="color:#64748b;font-size:12px;">Sent via UrbanCart Mail Engine.</p>
    </div>"""

    ok, err = send_email(recipient, subject, plain, html)
    active_providers = {
        'webhook_configured': bool(os.environ.get('EMAIL_WEBHOOK_URL')),
        'brevo_configured': bool(os.environ.get('BREVO_API_KEY')),
        'resend_configured': bool(os.environ.get('RESEND_API_KEY')),
        'smtp_configured': bool(getattr(settings, 'EMAIL_HOST_USER', '')),
    }

    advice = None
    if not ok:
        err_lower = str(err).lower()
        if 'not yet activated' in err_lower or ('brevo' in err_lower and 'permission_denied' in err_lower):
            advice = (
                "Brevo Account Activation Pending: Brevo requires new accounts to be activated before sending transactional emails. "
                "You can email contact@brevo.com to unlock it, OR use Google Apps Script (EMAIL_WEBHOOK_URL) which works instantly without any approval or domain setup!"
            )
        elif 'resend' in err_lower and ('403' in err_lower or 'only sends to account owner' in err_lower):
            advice = (
                "Resend Sandbox Limitation: Resend free tier without a custom domain only delivers to kdev23416@gmail.com. "
                "To deliver to any customer email address, deploy the Google Apps Script Webhook (EMAIL_WEBHOOK_URL) or activate Brevo."
            )
        elif 'render' in err_lower or 'smtp' in err_lower:
            advice = (
                "Render Free tier blocks outbound SMTP port 587. Add EMAIL_WEBHOOK_URL (Google Apps Script Web App) or BREVO_API_KEY in Render Environment Variables for HTTPS delivery."
            )

    return Response({
        'status': 'success' if ok else 'failed',
        'email_sent': ok,
        'recipient': recipient,
        'error': err,
        'advice': advice,
        'active_providers': active_providers,
    }, status=status.HTTP_200_OK)

