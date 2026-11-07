import uuid
import random
import re
from decimal import Decimal
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import viewsets

from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress, EmailOTP
from .serializers import (
    CategorySerializer, ProductSerializer, CartItemSerializer, 
    OrderSerializer, OrderItemSerializer, ShippingAddressSerializer, UserSerializer
)
from .utils import send_otp_email

# --- PRODUCT & CATEGORY VIEWSETS ---

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Product.objects.all().order_by('-created_at')
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

    @action(detail=False, methods=['get'])
    def sections(self, request):
        all_products = Product.objects.all().order_by('-created_at')
        
        # Spotlight (is_featured or top 6)
        spotlight = all_products.filter(is_featured=True)[:6]
        if not spotlight.exists() or spotlight.count() < 3:
            spotlight = all_products[:6]

        # Deals (highest rated or discounted)
        deals = all_products.order_by('-rating')[:10]

        # Suggested
        suggested = all_products.order_by('id')[:10]

        return Response({
            'spotlight': ProductSerializer(spotlight, many=True).data,
            'deals': ProductSerializer(deals, many=True).data,
            'suggested': ProductSerializer(suggested, many=True).data,
            'total_count': all_products.count()
        })


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
        print(f"[UrbanCart SMTP Error] {error_msg}")
    print(f"[UrbanCart OTP API Log] Generated OTP for {email}: {otp} (Sent via SMTP: {email_sent})")

    return Response({
        'status': 'success',
        'message': f'Verification code sent to {email}. Please check your inbox.',
        'email': email,
        'email_sent': email_sent,
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

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        'status': 'success',
        'token': token.key,
        'user': UserSerializer(user).data,
        'message': f'Welcome back, {user.first_name or user.username}!'
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

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

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

    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return Response({
        'orders': OrderSerializer(orders, many=True).data,
        'total_spent': str(sum(order.total_amount for order in orders)),
        'reward_points': int(sum(order.total_amount for order in orders) // 10)
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


# --- AI CHATBOT API ---

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def ai_chatbot_api(request):
    message = request.data.get('message', '').strip()
    if not message:
        return Response({
            'reply': "Hey there! 👋 I'm your UrbanKart AI Assistant. How can I help you today? You can ask me to find hoodies, sneakers, gadgets, track your order, or learn about UrbanCoins!",
            'products': []
        })

    msg_lower = message.lower()
    suggested_products = []

    # 1. ORDER TRACKING & SHIPMENT
    if any(k in msg_lower for k in ['order', 'track', 'status', 'kaha hai', 'kahan', 'parcel', 'delivery kab', 'dispatch']):
        order_num_match = re.search(r'(?:#|order\s*(?:id\s*)?)(\d+)', msg_lower)
        target_order = None

        if order_num_match:
            order_id = int(order_num_match.group(1))
            if request.user.is_authenticated:
                target_order = Order.objects.filter(id=order_id, user=request.user).first()
            if not target_order:
                target_order = Order.objects.filter(id=order_id).first()
        elif request.user.is_authenticated:
            target_order = Order.objects.filter(user=request.user).order_by('-created_at').first()

        if target_order:
            status_emoji = '🚚' if target_order.order_status == 'Shipped' else ('🎉' if target_order.order_status == 'Delivered' else '📦')
            reply = (
                f"{status_emoji} **Order #{target_order.id} Status:**\n\n"
                f"• **Current Stage:** {target_order.order_status}\n"
                f"• **Total Amount:** ₹{target_order.total_amount}\n"
                f"• **Payment:** {target_order.payment_status} ({target_order.get_payment_method_display()})\n"
                f"• **Destination:** {target_order.city} ({target_order.postal_code})\n"
                f"• **Estimated Delivery:** 2 to 3 business days via Express Courier."
            )
            return Response({'reply': reply, 'products': []})
        elif not request.user.is_authenticated:
            reply = "To track your orders instantly, please sign in with OTP or tell me your specific Order ID (e.g. 'Track order #1')."
            return Response({'reply': reply, 'products': []})
        else:
            reply = "You haven't placed any orders yet. Here are our top trending drops:"
            products = Product.objects.filter(is_featured=True)[:3]
            for p in products:
                suggested_products.append(ProductSerializer(p).data)
            return Response({'reply': reply, 'products': suggested_products})

    # 2. URBANCOINS & LOYALTY
    if any(k in msg_lower for k in ['coin', 'reward', 'points', 'loyalty', 'cashback', 'urbancoin', 'coupon']):
        reply = (
            "🪙 **UrbanCoins VIP Rewards Program:**\n\n"
            "• **Earn 10% Back:** 1 UrbanCoin for every ₹10 spent on any purchase.\n"
            "• **Direct Value:** 1 UrbanCoin = ₹1 INR cash discount!\n"
            "• **Auto-Applied:** Coins automatically discount your total during checkout.\n"
            "• **Never Expires:** Your coins stay active indefinitely in your wallet!"
        )
        return Response({'reply': reply, 'products': []})

    # 3. SHIPPING & PAYMENT
    if any(k in msg_lower for k in ['shipping', 'delivery charge', 'charges kitna', 'kab aayega', 'cod', 'payment method', 'free delivery']):
        reply = (
            "⚡ **Shipping & Payment Options:**\n\n"
            "• **Express Delivery:** Pan-India delivery within 2 to 4 business days.\n"
            "• **Flat Fee:** Express shipping is ₹99.\n"
            "• **Payment Modes:** UPI (GPay, PhonePe, Paytm), Cards (Visa/Mastercard/RuPay), and Cash on Delivery (COD) are all supported!"
        )
        return Response({'reply': reply, 'products': []})

    # 4. RETURNS & REFUNDS
    if any(k in msg_lower for k in ['return', 'refund', 'exchange', 'replace', 'wapas', 'cancel']):
        reply = (
            "🔄 **UrbanKart 7-Day Hassle-Free Returns:**\n\n"
            "• We offer a **7-Day Return & Replacement Policy** on all streetwear apparel, footwear, and tech accessories.\n"
            "• Items must be unused in original packaging."
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
