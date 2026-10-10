import uuid
import json
import random
import re
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress, EmailOTP
from .serializers import (
    CategorySerializer, ProductSerializer, CartItemSerializer, 
    OrderSerializer, OrderItemSerializer, ShippingAddressSerializer
)

# --- DJANGO REST FRAMEWORK (DRF) VIEWSETS ---

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('order_status')
        if new_status in dict(Order.ORDER_STATUS_CHOICES):
            order.order_status = new_status
            if new_status == 'Delivered':
                order.payment_status = 'Paid'
            order.save()
            return Response({'status': 'order status updated', 'order_status': order.order_status})
        return Response({'error': 'invalid status'}, status=400)


# --- TEMPLATE VIEWS FOR FRONTEND WEB STORE ---

def home(request):
    selected_category = request.GET.get('category', 'All')
    search_query = request.GET.get('q', '')

    products = Product.objects.all().order_by('-created_at')

    if selected_category and selected_category != 'All':
        products = products.filter(category__iexact=selected_category)

    if search_query:
        products = products.filter(name__icontains=search_query)

    cart_items = CartItem.objects.all()
    cart_count = sum(item.quantity for item in cart_items)
    categories = ['All', 'Clothing', 'Footwear', 'Electronics', 'Wearables', 'Gaming', 'Lifestyle', 'Home Tech']

    context = {
        'products': products,
        'selected_category': selected_category,
        'search_query': search_query,
        'categories': categories,
        'cart_count': cart_count,
        'total_products_count': Product.objects.count(),
    }
    return render(request, 'store/index.html', context)


# --- CART VIEWS ---

def add_to_cart(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    cart_item, created = CartItem.objects.get_or_create(product=product)
    
    if not created:
        cart_item.quantity += 1
        cart_item.save()
    
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.GET.get('ajax') == '1':
        cart_count = sum(item.quantity for item in CartItem.objects.all())
        return JsonResponse({'status': 'success', 'message': f'Added {product.name} to your cart!', 'cart_count': cart_count, 'product_name': product.name})

    messages.success(request, f"Added {product.name} to your cart!")
    return redirect('home')


def cart_detail(request):
    cart_items = CartItem.objects.all()
    subtotal = Decimal('0.00')
    for item in cart_items:
        subtotal += item.get_total_price()
        
    shipping = Decimal('99.00') if subtotal > Decimal('0.00') else Decimal('0.00')
    grand_total = subtotal + shipping

    context = {
        'cart_items': cart_items,
        'subtotal': subtotal,
        'shipping': shipping,
        'grand_total': grand_total,
        'cart_count': sum(item.quantity for item in cart_items),
    }
    return render(request, 'store/cart.html', context)


def remove_from_cart(request, item_id):
    cart_item = get_object_or_404(CartItem, id=item_id)
    cart_item.delete()
    messages.info(request, "Item removed from your cart.")
    return redirect('cart_detail')


# --- AUTHENTICATION & EMAIL OTP VIEWS ---

def send_email_otp(request):
    """
    Generates a secure 6-digit OTP, stores in EmailOTP and sends to user's email.
    Works seamlessly with AJAX or standard form submissions.
    """
    if request.method != 'POST':
        return redirect('login')

    email = request.POST.get('email', '').strip().lower()
    if not email or '@' not in email or '.' not in email:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json':
            return JsonResponse({'status': 'error', 'message': 'Please provide a valid email address.'}, status=400)
        messages.error(request, 'Please provide a valid email address.')
        return redirect('login')

    # Generate 6-digit numeric OTP
    otp = f"{random.randint(100000, 999999)}"

    # Invalidate old unverified OTPs for this email and create new
    EmailOTP.objects.filter(email=email, is_verified=False).delete()
    EmailOTP.objects.create(email=email, otp=otp)

    request.session['otp_email'] = email

    # Email Subject & Body
    subject = f"Your UrbanCart Login OTP: {otp}"
    message = (
        f"Hello,\n\n"
        f"Your 6-digit login verification code for UrbanCart is:\n\n"
        f"    {otp}\n\n"
        f"This code will expire in 10 minutes.\n"
        f"Please do not share this OTP with anyone for your account security.\n\n"
        f"If you did not request this login code, you can safely ignore this email.\n\n"
        f"Happy Shopping,\n"
        f"Team UrbanCart\n"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'UrbanCart <noreply@urbancart.com>'),
            recipient_list=[email],
            fail_silently=False
        )
    except Exception as e:
        pass

    # Development notice so user can test without external SMTP setup
    if settings.DEBUG:
        messages.success(request, f"OTP sent to {email}! (Dev Code: {otp})")
    else:
        messages.success(request, f"OTP sent to {email}. Please check your inbox.")

    if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json':
        return JsonResponse({'status': 'success', 'message': f'OTP sent to {email}', 'email': email, 'dev_otp': otp if settings.DEBUG else None})

    next_param = request.GET.get('next', '')
    next_query = f"&next={next_param}" if next_param else ""
    return redirect(f"/login/?step=otp&email={email}{next_query}")


def verify_email_otp(request):
    """
    Verifies 6-digit OTP sent to user's email and signs them in.
    Automatically creates user account if new customer!
    """
    if request.method != 'POST':
        return redirect('login')

    email = request.POST.get('email', '').strip().lower() or request.session.get('otp_email', '').strip().lower()
    otp = request.POST.get('otp', '').strip()
    next_url = request.POST.get('next') or request.GET.get('next') or 'user_dashboard'

    if not email or not otp:
        messages.error(request, "Email and 6-digit OTP code are required.")
        return redirect('login')

    otp_record = EmailOTP.objects.filter(email=email, otp=otp, is_verified=False).order_by('-created_at').first()

    if not otp_record or otp_record.is_expired():
        if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json':
            return JsonResponse({'status': 'error', 'message': 'Invalid or expired OTP code. Please request a new one.'}, status=400)
        messages.error(request, "Invalid or expired OTP code. Please try again.")
        return redirect(f"/login/?step=otp&email={email}")

    # Mark OTP as verified
    otp_record.is_verified = True
    otp_record.save()

    # Find or create User
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

    login(request, user, backend='django.contrib.auth.backends.ModelBackend')
    request.session.pop('otp_email', None)

    messages.success(request, f"Welcome to UrbanCart, {user.first_name or user.username}!")

    if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json':
        return JsonResponse({'status': 'success', 'redirect_url': '/dashboard/'})

    return redirect(next_url)


def register_user(request):
    if request.user.is_authenticated:
        return redirect('user_dashboard')
        
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"Account created successfully! Welcome to UrbanCart, {user.username}.")
            return redirect('user_dashboard')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = UserCreationForm()
        
    context = {'form': form}
    return render(request, 'store/register.html', context)


def login_user(request):
    if request.user.is_authenticated:
        return redirect('user_dashboard')

    step = request.GET.get('step', 'email')
    email = request.GET.get('email', request.session.get('otp_email', ''))

    if request.method == 'POST' and 'username' in request.POST:
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Welcome back, {user.username}!")
            next_url = request.GET.get('next', 'user_dashboard')
            return redirect(next_url)
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()

    context = {
        'form': form,
        'step': step,
        'email': email,
    }
    return render(request, 'store/login.html', context)


def google_login(request):
    if request.user.is_authenticated:
        return redirect('user_dashboard')

    if request.method == 'POST':
        gmail = request.POST.get('gmail', '').strip().lower()
        
        if not gmail or '@' not in gmail:
            messages.error(request, "Please enter a valid Gmail address.")
            return redirect('login')

        username = gmail.split('@')[0]
        username = ''.join(e for e in username if e.isalnum() or e in '_-')[:30]
        if not username:
            username = f"user_{uuid.uuid4().hex[:6]}"

        user = User.objects.filter(email=gmail).first()
        if not user:
            user = User.objects.filter(username=username).first()

        if not user:
            user = User.objects.create_user(
                username=username,
                email=gmail,
                first_name=username.capitalize()
            )
            user.set_unusable_password()
            user.save()
            messages.success(request, f"Google Account Connected! Welcome to UrbanCart, {user.first_name} ({gmail}).")
        else:
            messages.success(request, f"Signed in with Google as {user.email}!")

        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        next_url = request.GET.get('next', 'user_dashboard')
        return redirect(next_url)

    context = {}
    return render(request, 'store/google_login.html', context)


def logout_user(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('home')


# --- PROFESSIONAL CUSTOMER USER DASHBOARD VIEWS ---

@login_required(login_url='login')
def user_dashboard(request):
    """
    Renders professional customer dashboard with Order history, Address Book, Profile settings & reward points.
    """
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    addresses = ShippingAddress.objects.filter(user=request.user)

    total_spent = sum(order.total_amount for order in orders)
    active_shipments = orders.filter(order_status__in=['Processing', 'Shipped']).count()

    # Handle Profile Update
    if request.method == 'POST' and 'update_profile' in request.POST:
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip()

        request.user.first_name = first_name
        request.user.last_name = last_name
        if email:
            request.user.email = email
        request.user.save()
        messages.success(request, "Profile information updated successfully!")
        return redirect('user_dashboard')

    # Handle Add Address
    if request.method == 'POST' and 'add_address' in request.POST:
        full_name = request.POST.get('full_name', '').strip()
        street_address = request.POST.get('street_address', '').strip()
        city = request.POST.get('city', '').strip()
        state = request.POST.get('state', '').strip()
        postal_code = request.POST.get('postal_code', '').strip()
        is_default = request.POST.get('is_default') == 'on'

        if is_default:
            ShippingAddress.objects.filter(user=request.user).update(is_default=False)

        ShippingAddress.objects.create(
            user=request.user,
            full_name=full_name or request.user.get_full_name() or request.user.username,
            street_address=street_address,
            city=city,
            state=state,
            postal_code=postal_code,
            is_default=is_default or not addresses.exists()
        )
        messages.success(request, "New shipping address added to your address book!")
        return redirect('user_dashboard')

    context = {
        'orders': orders,
        'recent_orders': orders[:3],
        'addresses': addresses,
        'total_orders_count': orders.count(),
        'total_spent': total_spent,
        'active_shipments': active_shipments,
        'reward_points': int(total_spent // 10),  # 1 point per 10 rupees spent
    }
    return render(request, 'store/user_dashboard.html', context)


@login_required(login_url='login')
def delete_address(request, address_id):
    address = get_object_or_404(ShippingAddress, id=address_id, user=request.user)
    address.delete()
    messages.info(request, "Shipping address deleted.")
    return redirect('user_dashboard')


@login_required(login_url='login')
def user_orders(request):
    return redirect('user_dashboard')


# --- CHECKOUT & PAYMENT SIMULATION VIEWS ---

def checkout(request):
    cart_items = CartItem.objects.all()
    if not cart_items.exists():
        messages.warning(request, "Your cart is empty. Add some products before checking out!")
        return redirect('home')

    subtotal = sum(item.get_total_price() for item in cart_items)
    shipping = Decimal('99.00')
    grand_total = subtotal + shipping

    initial_name = f"{request.user.first_name} {request.user.last_name}".strip() if request.user.is_authenticated else ""
    initial_email = request.user.email if request.user.is_authenticated else ""

    # Check for default saved address
    default_address = None
    if request.user.is_authenticated:
        default_address = ShippingAddress.objects.filter(user=request.user, is_default=True).first()

    context = {
        'cart_items': cart_items,
        'subtotal': subtotal,
        'shipping': shipping,
        'grand_total': grand_total,
        'initial_name': initial_name or (default_address.full_name if default_address else ''),
        'initial_email': initial_email,
        'default_address': default_address,
        'cart_count': sum(item.quantity for item in cart_items),
    }
    return render(request, 'store/checkout.html', context)


def process_payment(request):
    if request.method != 'POST':
        return redirect('checkout')

    cart_items = CartItem.objects.all()
    if not cart_items.exists():
        messages.error(request, "Session expired or cart is empty.")
        return redirect('home')

    subtotal = sum(item.get_total_price() for item in cart_items)
    shipping = Decimal('99.00')
    grand_total = subtotal + shipping

    full_name = request.POST.get('full_name')
    email = request.POST.get('email')
    address = request.POST.get('address')
    city = request.POST.get('city')
    postal_code = request.POST.get('postal_code')
    payment_method = request.POST.get('payment_method', 'CARD')

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

    # Save to user's address book if requested or if first address
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

    messages.success(request, f"Payment Successful! Order #{order.id} placed for ₹{grand_total}.")
    return redirect('order_success', order_id=order.id)


def order_success(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    context = {'order': order}
    return render(request, 'store/order_success.html', context)


# --- AI CHATBOT ASSISTANT VIEW ---

@csrf_exempt
def ai_chatbot(request):
    """
    Intelligent E-Commerce AI Chatbot with natural language catalog search,
    live shipment order tracking, policy assistance, and interactive product cards.
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'POST method required'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        message = data.get('message', '').strip()
    except Exception:
        message = request.POST.get('message', '').strip()

    if not message:
        return JsonResponse({
            'reply': "Hey there! 👋 I'm your UrbanKart AI Assistant. How can I help you today? You can ask me to find hoodies, sneakers, gadgets, track your order, or learn about UrbanCoins!",
            'products': []
        })

    msg_lower = message.lower()
    reply = ""
    suggested_products = []

    # 1. ORDER TRACKING & SHIPMENT INQUIRIES
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
                f"• **Estimated Delivery:** 2 to 3 business days via Express Courier.\n\n"
                f"View your digital invoice here: [Tax Invoice](/order-success/{target_order.id}/)"
            )
            return JsonResponse({'reply': reply, 'products': []})
        elif not request.user.is_authenticated:
            reply = (
                "To track your orders instantly, please [Sign In with OTP](/login/) or tell me your specific Order ID (e.g. *'Track order #1'*)."
            )
            return JsonResponse({'reply': reply, 'products': []})
        else:
            reply = "You haven't placed any orders yet. Here are our top trending streetwear drops & electronics:"
            products = Product.objects.filter(is_featured=True)[:3]
            for p in products:
                suggested_products.append({
                    'id': p.id,
                    'name': p.name,
                    'price': float(p.price),
                    'category': p.category,
                    'image_url': p.image_url,
                    'rating': float(p.rating),
                })
            return JsonResponse({'reply': reply, 'products': suggested_products})

    # 2. URBANCOINS & LOYALTY PROGRAM
    if any(k in msg_lower for k in ['coin', 'reward', 'points', 'loyalty', 'cashback', 'urbancoin', 'discount code', 'coupon']):
        reply = (
            "🪙 **UrbanCoins VIP Rewards Program:**\n\n"
            "• **Earn 10% Back:** You receive 1 UrbanCoin for every ₹10 spent on any purchase.\n"
            "• **Direct Value:** 1 UrbanCoin = ₹1 INR direct cash discount!\n"
            "• **Auto-Applied:** Coins automatically discount your total during checkout.\n"
            "• **Never Expires:** Your coins stay active indefinitely in your wallet!\n\n"
            "Check your balance in the [Account Dashboard](/dashboard/)."
        )
        return JsonResponse({'reply': reply, 'products': []})

    # 3. SHIPPING, DELIVERY & COD POLICY
    if any(k in msg_lower for k in ['shipping', 'delivery charge', 'charges kitna', 'kab aayega', 'cod', 'payment method', 'free delivery']):
        reply = (
            "⚡ **Shipping & Payment Options:**\n\n"
            "• **Express Delivery:** Pan-India delivery within 2 to 4 business days.\n"
            "• **Flat Fee:** Express shipping is ₹99.\n"
            "• **Payment Modes:** UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa/Mastercard/RuPay), and Cash on Delivery (COD) are all supported!"
        )
        return JsonResponse({'reply': reply, 'products': []})

    # 4. RETURNS & REFUNDS
    if any(k in msg_lower for k in ['return', 'refund', 'exchange', 'replace', 'wapas', 'cancel']):
        reply = (
            "🔄 **UrbanKart 7-Day Hassle-Free Returns:**\n\n"
            "• We offer a **7-Day Return & Replacement Policy** on all streetwear apparel, footwear, and tech accessories.\n"
            "• Items must be unused in original packaging. Request returns directly from your [Dashboard](/dashboard/)."
        )
        return JsonResponse({'reply': reply, 'products': []})

    # 5. GREETING / CASUAL
    if any(msg_lower.startswith(g) for g in ['hi', 'hello', 'hey', 'namaste', 'bhai', 'hola', 'yo', 'sup']) and len(msg_lower.split()) <= 4:
        user_name = request.user.first_name or request.user.username if request.user.is_authenticated else "there"
        reply = (
            f"Hey {user_name}! 👋 Welcome to UrbanKart AI!\n\n"
            "I'm your personal shopping assistant. You can ask me to:\n"
            "• Find Hoodies, Sneakers, or Tech Gear 👟\n"
            "• Filter by budget (e.g. *'shoes under 5000'*)\n"
            "• Track your active orders 📦\n"
            "• Check UrbanCoins rewards & delivery details ⚡\n\n"
            "What can I help you find today?"
        )
        return JsonResponse({'reply': reply, 'products': []})

    # 6. PRODUCT SEARCH & RECOMMENDATION LOGIC
    max_price = None
    price_match = re.search(r'(?:under|below|less than|within|ke andar|upto|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+)', msg_lower)
    if price_match:
        try:
            max_price = int(price_match.group(1))
        except ValueError:
            pass

    qs = Product.objects.all()

    # Match Category keywords
    category_target = None
    if any(w in msg_lower for w in ['hoodie', 'hoodies', 'streetwear', 'jacket', 'shirt', 'clothing', 'apparel', 't-shirt', 'tshirt', 'sweatshirt']):
        category_target = 'Clothing'
    elif any(w in msg_lower for w in ['shoe', 'shoes', 'sneaker', 'sneakers', 'footwear', 'boot', 'boots', 'runner', 'runners']):
        category_target = 'Footwear'
    elif any(w in msg_lower for w in ['headphone', 'headphones', 'earbud', 'earbuds', 'audio', 'sound', 'speaker', 'anc', 'noise']):
        category_target = 'Electronics'
    elif any(w in msg_lower for w in ['watch', 'smartwatch', 'smart watch', 'wearable', 'band', 'fitness']):
        category_target = 'Wearables'
    elif any(w in msg_lower for w in ['keyboard', 'gaming', 'mechanical', 'mouse', 'rgb', 'cyberdeck']):
        category_target = 'Gaming'

    if category_target:
        qs = qs.filter(category__iexact=category_target)

    # Filter by budget if provided
    if max_price:
        qs = qs.filter(price__lte=max_price)

    # Search by terms
    search_terms = [w for w in msg_lower.split() if w not in ['show', 'me', 'the', 'under', 'below', 'bhai', 'kuch', 'accha', 'best', 'for', 'a', 'an', 'in', 'and', 'chahiye', 'dikhao', 'dikhana', 'recommend', 'suggest']]
    if search_terms and not category_target:
        q_obj = Q()
        for term in search_terms:
            q_obj |= Q(name__icontains=term) | Q(category__icontains=term) | Q(description__icontains=term)
        qs = qs.filter(q_obj)

    matched_products = list(qs.order_by('-rating', '-created_at')[:4])

    if matched_products:
        price_text = f" under ₹{max_price:,}" if max_price else ""
        category_text = f" in {category_target}" if category_target else ""
        reply = f"🔥 Here are the top recommended items{category_text}{price_text} from our catalog:"
        for p in matched_products:
            suggested_products.append({
                'id': p.id,
                'name': p.name,
                'price': float(p.price),
                'category': p.category,
                'image_url': p.image_url,
                'rating': float(p.rating),
            })
    else:
        # Fallback to featured products
        fallback = Product.objects.filter(is_featured=True)[:3]
        if fallback.exists():
            reply = f"I couldn't find exact items matching '{message}', but check out these trending bestsellers:"
            for p in fallback:
                suggested_products.append({
                    'id': p.id,
                    'name': p.name,
                    'price': float(p.price),
                    'category': p.category,
                    'image_url': p.image_url,
                    'rating': float(p.rating),
                })
        else:
            reply = "I'm ready to help you shop! You can ask for streetwear hoodies, sneakers, audio gear, mechanical keyboards, or check your orders."

    return JsonResponse({'reply': reply, 'products': suggested_products})

