from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress, SupportTicket, ProductReview

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    discount_percent = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_discount_percent(self, obj):
        return obj.get_discount_percent()

    def get_original_price(self, obj):
        return str(obj.get_original_price())

class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    total_price = serializers.ReadOnlyField(source='get_total_price')

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_details', 'quantity', 'total_price', 'created_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'price', 'quantity', 'get_total_price']

    def get_product_image(self, obj):
        return obj.product.image_url if obj.product else ''

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'full_name', 'email', 'address', 
            'city', 'postal_code', 'total_amount', 'payment_method', 
            'payment_status', 'order_status', 'transaction_id',
            'cancel_reason', 'return_reason', 'refund_amount', 'refund_reference',
            'items', 'created_at', 'updated_at'
        ]

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'

class SupportTicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'order', 'issue_type', 'subject', 'message',
            'admin_reply', 'status', 'customer_name', 'customer_email',
            'created_at', 'updated_at'
        ]

    def get_customer_name(self, obj):
        if obj.user:
            return obj.user.first_name or obj.user.username
        return 'Customer'

    def get_customer_email(self, obj):
        return obj.user.email if obj.user else ''


class ProductReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    product_name = serializers.ReadOnlyField(source='product.name')
    is_own_review = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'product_name', 'reviewer_name', 'rating',
            'title', 'comment', 'is_verified_purchase', 'is_own_review',
            'created_at', 'updated_at',
        ]

    def get_reviewer_name(self, obj):
        if obj.user:
            full = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return full or obj.user.username
        return 'Customer'

    def get_is_own_review(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.user_id == request.user.id)
