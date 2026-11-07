from django.contrib import admin
from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress, EmailOTP

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'rating', 'is_featured', 'created_at')
    list_filter = ('category', 'is_featured', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('price', 'stock', 'is_featured')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('product', 'quantity', 'created_at')

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'email', 'total_amount', 'payment_method', 'order_status', 'payment_status', 'created_at')
    list_filter = ('order_status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('full_name', 'email', 'transaction_id')
    inlines = [OrderItemInline]
    actions = ['mark_as_shipped', 'mark_as_delivered']

    @admin.action(description='Mark selected orders as Shipped')
    def mark_as_shipped(self, request, queryset):
        queryset.update(order_status='Shipped')

    @admin.action(description='Mark selected orders as Delivered')
    def mark_as_delivered(self, request, queryset):
        queryset.update(order_status='Delivered', payment_status='Paid')

@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'city', 'postal_code', 'is_default')
    search_fields = ('full_name', 'city', 'street_address')

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('email', 'otp', 'is_verified', 'created_at')
    search_fields = ('email', 'otp')
    list_filter = ('is_verified', 'created_at')

