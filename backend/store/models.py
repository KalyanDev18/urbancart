from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Categories'

class Seller(models.Model):
    name = models.CharField(max_length=200, unique=True, db_index=True)
    contact_person = models.CharField(max_length=150, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='Delhi')
    address = models.TextField(blank=True, default='')
    gst_number = models.CharField(max_length=30, blank=True, default='')
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.8, validators=[MinValueValidator(0), MaxValueValidator(5)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Product(models.Model):
    seller = models.ForeignKey(Seller, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    category_rel = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    category = models.CharField(max_length=100, default='General')
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    stock = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    review_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def recalculate_rating(self):
        agg = self.reviews.aggregate(avg=models.Avg('rating'), cnt=models.Count('id'))
        cnt = agg['cnt'] or 0
        avg = agg['avg'] or 0
        self.rating = round(Decimal(str(avg)), 1) if cnt > 0 else Decimal('0.0')
        self.review_count = cnt
        self.save(update_fields=['rating', 'review_count'])

    def get_discount_percent(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return int(((self.compare_at_price - self.price) / self.compare_at_price) * 100)
        return 0

    def get_original_price(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return self.compare_at_price
        return Decimal('0.00')

class ShippingAddress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shipping_addresses')
    full_name = models.CharField(max_length=255)
    street_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, default='State')
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='India')
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'Shipping Addresses'

    def __str__(self):
        return f"{self.full_name} - {self.city}"

class CartItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_total_price(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

class DeliveryAgent(models.Model):
    VEHICLE_CHOICES = (
        ('Bike', 'Bike / Motorcycle'),
        ('Scooter', 'Scooter'),
        ('Electric Bike', 'Electric Bike (EV)'),
        ('Van', 'Delivery Van / Truck'),
        ('Auto', 'Auto Rickshaw / 3-Wheeler'),
    )

    STATUS_CHOICES = (
        ('Available', 'Available (On Duty)'),
        ('Out for Delivery', 'Out for Delivery'),
        ('Off Duty', 'Off Duty'),
    )

    name = models.CharField(max_length=150, db_index=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True, default='')
    vehicle_type = models.CharField(max_length=30, choices=VEHICLE_CHOICES, default='Bike')
    vehicle_number = models.CharField(max_length=50, blank=True, default='')
    city = models.CharField(max_length=100, default='Delhi')
    assigned_area = models.CharField(max_length=150, blank=True, default='')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Available')
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.9, validators=[MinValueValidator(0), MaxValueValidator(5)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.vehicle_type}) - {self.status}"

class Order(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('CARD', 'Credit / Debit Card'),
        ('UPI', 'UPI Payment (GPay / PhonePe / Paytm)'),
        ('COD', 'Cash on Delivery'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Failed', 'Failed'),
        ('Refund Initiated', 'Refund Initiated'),
        ('Refunded', 'Refunded'),
    )

    ORDER_STATUS_CHOICES = (
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Return Requested', 'Return Requested'),
        ('Returned', 'Returned'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    delivery_agent = models.ForeignKey(DeliveryAgent, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_orders')
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CARD')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Paid')
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='Processing')
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    cancel_reason = models.TextField(blank=True, default='')
    return_reason = models.TextField(blank=True, default='')
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_reference = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.full_name} ({self.order_status})"

    @property
    def invoice_number(self):
        return f"INV-2026-{self.id:05d}"


class SupportTicket(models.Model):
    ISSUE_CHOICES = (
        ('CANCEL', 'Order Cancellation'),
        ('RETURN', 'Return / Replacement'),
        ('REFUND', 'Refund Status'),
        ('DELIVERY', 'Delivery & Tracking'),
        ('OTHER', 'General Help'),
    )

    STATUS_CHOICES = (
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    issue_type = models.CharField(max_length=20, choices=ISSUE_CHOICES, default='OTHER')
    subject = models.CharField(max_length=200)
    message = models.TextField()
    admin_reply = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Ticket #{self.id} ({self.issue_type}) - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def get_total_price(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Product'} (Order #{self.order.id})"

class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Email OTP'
        verbose_name_plural = 'Email OTPs'
        ordering = ['-created_at']

    def is_expired(self):
        from django.utils import timezone
        return (timezone.now() - self.created_at).total_seconds() > 600

    def __str__(self):
        return f"{self.email} - {self.otp} ({'Verified' if self.is_verified else 'Pending'})"


class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=120, blank=True, default='')
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}★ on {self.product.name} by {self.user.username}"

