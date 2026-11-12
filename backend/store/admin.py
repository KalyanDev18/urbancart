from django.contrib import admin
from .models import Category, Product, CartItem, Order, OrderItem, ShippingAddress, EmailOTP, SupportTicket, ProductReview

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'rating', 'review_count', 'is_featured', 'created_at')
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
    list_display = ('id', 'full_name', 'email', 'total_amount', 'payment_method', 'order_status', 'payment_status', 'refund_reference', 'created_at')
    list_filter = ('order_status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('full_name', 'email', 'transaction_id', 'refund_reference')
    inlines = [OrderItemInline]
    actions = ['mark_as_shipped', 'mark_as_delivered', 'mark_as_refunded']

    @admin.action(description='Mark selected orders as Shipped')
    def mark_as_shipped(self, request, queryset):
        queryset.update(order_status='Shipped')

    @admin.action(description='Mark selected orders as Delivered')
    def mark_as_delivered(self, request, queryset):
        queryset.update(order_status='Delivered', payment_status='Paid')

    @admin.action(description='Mark selected orders as Returned & Refunded')
    def mark_as_refunded(self, request, queryset):
        queryset.update(order_status='Returned', payment_status='Refunded')

@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'city', 'postal_code', 'is_default')
    search_fields = ('full_name', 'city', 'street_address')

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ('email', 'otp', 'is_verified', 'created_at')
    search_fields = ('email', 'otp')
    list_filter = ('is_verified', 'created_at')

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'order', 'issue_type', 'subject', 'status', 'created_at')
    list_filter = ('issue_type', 'status', 'created_at')
    search_fields = ('subject', 'message', 'user__username', 'user__email')
    list_editable = ('status',)

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'user', 'rating', 'title', 'is_verified_purchase', 'created_at')
    list_filter = ('rating', 'is_verified_purchase', 'created_at')
    search_fields = ('title', 'comment', 'product__name', 'user__username', 'user__email')

