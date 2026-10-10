from rest_framework import serializers
from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    total_price = serializers.ReadOnlyField(source='get_total_price')

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_details', 'quantity', 'total_price', 'created_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity', 'get_total_price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'full_name', 'email', 'address', 
            'city', 'postal_code', 'total_amount', 'payment_method', 
            'payment_status', 'order_status', 'transaction_id', 'items', 'created_at'
        ]

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = '__all__'
