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

    def __str__(self):
        return self.name

class Product(models.Model):
    category_rel = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    category = models.CharField(max_length=100, default='General')
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=280, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    stock = models.IntegerField(default=10, validators=[MinValueValidator(0)])
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.8, validators=[MinValueValidator(1), MaxValueValidator(5)])
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

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
    )

    ORDER_STATUS_CHOICES = (
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.full_name} ({self.order_status})"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    def get_total_price(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Product'} (Order #{self.order.id})"
