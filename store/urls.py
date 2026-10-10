from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet, basename='api_products')
router.register(r'categories', views.CategoryViewSet, basename='api_categories')
router.register(r'orders', views.OrderViewSet, basename='api_orders')

urlpatterns = [
    # REST Framework Router Endpoints
    path('api/', include(router.urls)),

    # Web Template Routes
    path('', views.home, name='home'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/', views.cart_detail, name='cart_detail'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    
    # Auth & Email OTP Routes
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('send-otp/', views.send_email_otp, name='send_otp'),
    path('verify-otp/', views.verify_email_otp, name='verify_otp'),
    path('google-login/', views.google_login, name='google_login'),
    path('logout/', views.logout_user, name='logout'),
    
    # Customer Dashboard & Address Management Routes
    path('dashboard/', views.user_dashboard, name='user_dashboard'),
    path('dashboard/delete-address/<int:address_id>/', views.delete_address, name='delete_address'),
    path('my-orders/', views.user_orders, name='user_orders'),
    
    # Checkout & Payment Routes
    path('checkout/', views.checkout, name='checkout'),
    path('process-payment/', views.process_payment, name='process_payment'),
    path('order-success/<int:order_id>/', views.order_success, name='order_success'),

    # AI Chatbot Assistant API
    path('api/chatbot/', views.ai_chatbot, name='ai_chatbot'),
]
