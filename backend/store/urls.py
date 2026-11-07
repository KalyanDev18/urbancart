from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import api_views

router = DefaultRouter()
router.register(r'products', api_views.ProductViewSet, basename='api_products')
router.register(r'categories', api_views.CategoryViewSet, basename='api_categories')

urlpatterns = [
    # REST API Endpoints
    path('api/', include(router.urls)),
    
    # Auth APIs
    path('api/auth/send-otp/', api_views.send_email_otp_api, name='api_send_otp'),
    path('api/auth/verify-otp/', api_views.verify_email_otp_api, name='api_verify_otp'),
    path('api/auth/google/', api_views.google_auth_api, name='api_google_auth'),
    path('api/auth/login/', api_views.login_api, name='api_login'),
    path('api/auth/register/', api_views.register_api, name='api_register'),
    path('api/auth/me/', api_views.user_profile_api, name='api_user_me'),
    path('api/auth/logout/', api_views.logout_api, name='api_logout'),

    # Cart APIs
    path('api/cart/', api_views.cart_list_api, name='api_cart_list'),
    path('api/cart/add/', api_views.cart_add_api, name='api_cart_add'),
    path('api/cart/update/', api_views.cart_update_api, name='api_cart_update'),
    path('api/cart/item/<int:item_id>/', api_views.cart_remove_api, name='api_cart_remove'),
    path('api/cart/clear/', api_views.cart_clear_api, name='api_cart_clear'),

    # Checkout & Orders APIs
    path('api/checkout/', api_views.checkout_api, name='api_checkout'),
    path('api/orders/my-orders/', api_views.user_orders_api, name='api_my_orders'),
    path('api/orders/<int:order_id>/', api_views.order_detail_api, name='api_order_detail'),

    # Addresses APIs
    path('api/addresses/', api_views.user_addresses_api, name='api_addresses'),
    path('api/addresses/<int:address_id>/', api_views.delete_address_api, name='api_delete_address'),

    # AI Chatbot API
    path('api/chatbot/', api_views.ai_chatbot_api, name='api_chatbot'),

    # Web Template Fallback Routes (for backward compatibility)
    path('', views.home, name='home'),
    path('welcome/', views.welcome_landing, name='welcome'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/', views.cart_detail, name='cart_detail'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('send-otp/', views.send_email_otp, name='send_otp'),
    path('verify-otp/', views.verify_email_otp, name='verify_otp'),
    path('logout/', views.logout_user, name='logout'),
    path('dashboard/', views.user_dashboard, name='user_dashboard'),
    path('dashboard/delete-address/<int:address_id>/', views.delete_address, name='delete_address'),
    path('my-orders/', views.user_orders, name='user_orders'),
    path('checkout/', views.checkout, name='checkout'),
    path('process-payment/', views.process_payment, name='process_payment'),
    path('order-success/<int:order_id>/', views.order_success, name='order_success'),
]
