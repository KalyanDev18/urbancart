from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress, SupportTicket

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
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'order', 'issue_type', 'subject', 'message',
            'admin_reply', 'status', 'created_at', 'updated_at'
        ]
