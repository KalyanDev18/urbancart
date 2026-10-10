import uuid
import json
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress
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
    """
    Fetches products with optional category filtering and search query in Indian Rupees (INR).
    """
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


# --- AUTHENTICATION, GOOGLE & CLERK AUTH API VIEWS ---

def register_user(request):
    if request.user.is_authenticated:
        return redirect('home')
        
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"Account created successfully! Welcome to UrbanCart, {user.username}.")
            return redirect('home')
        else:
            messages.error(request, "Please correct the errors below.")
    else:
        form = UserCreationForm()
        
    context = {'form': form}
    return render(request, 'store/register.html', context)


def login_user(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f"Welcome back, {user.username}!")
            next_url = request.GET.get('next', 'home')
            return redirect(next_url)
        else:
            messages.error(request, "Invalid username or password.")
    else:
        form = AuthenticationForm()

    context = {'form': form}
    return render(request, 'store/login.html', context)


def google_login(request):
    if request.user.is_authenticated:
        return redirect('home')

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
        next_url = request.GET.get('next', 'home')
        return redirect(next_url)

    context = {}
    return render(request, 'store/google_login.html', context)


@csrf_exempt
def clerk_session_sync(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            clerk_id = data.get('clerk_id', '')
            email = data.get('email', '').strip().lower()
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')

            if not email:
                return JsonResponse({'status': 'error', 'message': 'Email required'}, status=400)

            username = email.split('@')[0]
            username = ''.join(e for e in username if e.isalnum() or e in '_-')[:30]

            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.filter(username=username).first()

            if not user:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name or username.capitalize(),
                    last_name=last_name
                )
                user.set_unusable_password()
                user.save()

            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            return JsonResponse({'status': 'success', 'username': user.username, 'email': user.email})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)


def logout_user(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('home')


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

    context = {
        'cart_items': cart_items,
        'subtotal': subtotal,
        'shipping': shipping,
        'grand_total': grand_total,
        'initial_name': initial_name,
        'initial_email': initial_email,
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
        transaction_id=transaction_id
    )

    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product=item.product,
            price=item.product.price,
            quantity=item.quantity
        )

    cart_items.delete()

    messages.success(request, f"Payment Successful! Order #{order.id} placed for ₹{grand_total}.")
    return redirect('order_success', order_id=order.id)


def order_success(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    context = {'order': order}
    return render(request, 'store/order_success.html', context)


@login_required(login_url='login')
def user_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    context = {'orders': orders}
    return render(request, 'store/user_orders.html', context)
