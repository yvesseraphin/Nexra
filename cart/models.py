from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Coupon(models.Model):
    DISCOUNT_PERCENT = 'percent'
    DISCOUNT_FIXED   = 'fixed'
    DISCOUNT_TYPES   = [
        (DISCOUNT_PERCENT, 'Percentage (%)'),
        (DISCOUNT_FIXED,   'Fixed amount (RWF)'),
    ]

    code            = models.CharField(max_length=50, unique=True)
    description     = models.CharField(max_length=255, blank=True)
    discount_type   = models.CharField(max_length=10, choices=DISCOUNT_TYPES, default=DISCOUNT_PERCENT)
    discount_value  = models.DecimalField(max_digits=10, decimal_places=2)   # e.g. 20 = 20% or 5000 RWF
    min_order_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    max_discount    = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)  # cap for % coupons
    usage_limit     = models.PositiveIntegerField(null=True, blank=True)     # None = unlimited
    times_used      = models.PositiveIntegerField(default=0)
    is_active       = models.BooleanField(default=True)
    valid_from      = models.DateTimeField(default=timezone.now)
    valid_until     = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} — {self.discount_value}{'%' if self.discount_type == self.DISCOUNT_PERCENT else ' RWF'}"

    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False, 'This coupon is no longer active.'
        if now < self.valid_from:
            return False, 'This coupon is not yet valid.'
        if self.valid_until and now > self.valid_until:
            return False, 'This coupon has expired.'
        if self.usage_limit is not None and self.times_used >= self.usage_limit:
            return False, 'This coupon has reached its usage limit.'
        return True, None

    def calculate_discount(self, subtotal):
        """Return the discount amount for a given subtotal."""
        subtotal = float(subtotal)
        if self.discount_type == self.DISCOUNT_PERCENT:
            amount = subtotal * float(self.discount_value) / 100
            if self.max_discount is not None:
                amount = min(amount, float(self.max_discount))
        else:
            amount = float(self.discount_value)
        return round(min(amount, subtotal), 2)

    def to_dict(self, subtotal=0):
        discount = self.calculate_discount(subtotal)
        return {
            'code':          self.code,
            'description':   self.description,
            'discountType':  self.discount_type,
            'discountValue': float(self.discount_value),
            'discountAmount': discount,
            'maxDiscount':   float(self.max_discount) if self.max_discount else None,
            'minOrderValue': float(self.min_order_value),
        }


class CartItem(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product_id  = models.CharField(max_length=255)          # e.g. "tech-lg-smart-tv"
    slug        = models.CharField(max_length=255)
    title       = models.CharField(max_length=512)
    price       = models.CharField(max_length=100, blank=True)  # display string "660 000 RWF"
    price_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    image       = models.TextField(blank=True)
    page        = models.CharField(max_length=100, blank=True)
    quantity    = models.PositiveIntegerField(default=1)
    added_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product_id')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} — {self.title} x{self.quantity}"

    def to_dict(self):
        return {
            'id':         self.product_id,
            'slug':       self.slug,
            'title':      self.title,
            'price':      self.price,
            'priceValue': float(self.price_value),
            'image':      self.image,
            'page':       self.page,
            'quantity':   self.quantity,
            'addedAt':    self.added_at.isoformat(),
        }


class Order(models.Model):
    STATUS_CHOICES = [
        ('Confirmed',   'Confirmed'),
        ('Processing',  'Processing'),
        ('Dispatched',  'Dispatched'),
        ('Delivered',   'Delivered'),
        ('Cancelled',   'Cancelled'),
    ]

    user             = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_number     = models.CharField(max_length=50, unique=True)
    status           = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Confirmed')
    subtotal         = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    shipping_cost    = models.DecimalField(max_digits=14, decimal_places=2, default=5000)
    total            = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_items      = models.PositiveIntegerField(default=0)
    notes            = models.TextField(blank=True)

    # Contact
    contact_full_name = models.CharField(max_length=255, blank=True)
    contact_email     = models.EmailField(blank=True)
    contact_phone     = models.CharField(max_length=50, blank=True)

    # Shipping address
    ship_full_name    = models.CharField(max_length=255, blank=True)
    ship_address1     = models.CharField(max_length=512, blank=True)
    ship_address2     = models.CharField(max_length=512, blank=True)
    ship_city         = models.CharField(max_length=255, blank=True)
    ship_state_region = models.CharField(max_length=255, blank=True)
    ship_postal_code  = models.CharField(max_length=50, blank=True)
    ship_country      = models.CharField(max_length=100, blank=True, default='Rwanda')
    ship_instructions = models.TextField(blank=True)

    # Payment summary (masked — no real card data)
    payment_brand     = models.CharField(max_length=50, blank=True)
    payment_last4     = models.CharField(max_length=4, blank=True)
    payment_expiry    = models.CharField(max_length=10, blank=True)
    payment_holder    = models.CharField(max_length=255, blank=True)
    payment_label     = models.CharField(max_length=255, blank=True)
    payment_status    = models.CharField(max_length=100, blank=True, default='Payment details received')

    # Coupon
    coupon_code     = models.CharField(max_length=50, blank=True)
    coupon_discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    placed_at  = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-placed_at']

    def __str__(self):
        return f"{self.order_number} — {self.user.username}"

    def to_dict(self):
        return {
            'id':               str(self.pk),
            'orderNumber':      self.order_number,
            'status':           self.status,
            'subtotal':         float(self.subtotal),
            'shippingCost':     float(self.shipping_cost),
            'total':            float(self.total),
            'totalItems':       self.total_items,
            'totalLabel':       f"{int(self.total):,} RWF",
            'couponCode':       self.coupon_code,
            'couponDiscount':   float(self.coupon_discount),
            'notes':            self.notes,
            'placedAt':         self.placed_at.isoformat(),
            'updatedAt':        self.updated_at.isoformat(),
            'paymentStatus':    self.payment_status,
            'fulfillmentStatus': 'Preparing dispatch',
            'contact': {
                'fullName': self.contact_full_name,
                'email':    self.contact_email,
                'phone':    self.contact_phone,
            },
            'shippingAddress': {
                'fullName':             self.ship_full_name,
                'addressLine1':         self.ship_address1,
                'addressLine2':         self.ship_address2,
                'city':                 self.ship_city,
                'stateRegion':          self.ship_state_region,
                'postalCode':           self.ship_postal_code,
                'country':              self.ship_country,
                'deliveryInstructions': self.ship_instructions,
            },
            'paymentSummary': {
                'brand':      self.payment_brand,
                'last4':      self.payment_last4,
                'expiryLabel': self.payment_expiry,
                'holderName': self.payment_holder,
                'label':      self.payment_label,
            } if self.payment_last4 else None,
            'items': [item.to_dict() for item in self.items.all()],
        }


class OrderItem(models.Model):
    order       = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_id  = models.CharField(max_length=255)
    slug        = models.CharField(max_length=255, blank=True)
    title       = models.CharField(max_length=512)
    price       = models.CharField(max_length=100, blank=True)
    price_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    image       = models.TextField(blank=True)
    page        = models.CharField(max_length=100, blank=True)
    quantity    = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.order.order_number} — {self.title}"

    def to_dict(self):
        return {
            'id':         self.product_id,
            'slug':       self.slug,
            'title':      self.title,
            'price':      self.price,
            'priceValue': float(self.price_value),
            'image':      self.image,
            'page':       self.page,
            'quantity':   self.quantity,
        }


class PaymentMethod(models.Model):
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    type         = models.CharField(max_length=20, default='card')
    brand        = models.CharField(max_length=50, blank=True)
    last4        = models.CharField(max_length=4)
    expiry_month = models.CharField(max_length=2)
    expiry_year  = models.CharField(max_length=4)
    expiry_label = models.CharField(max_length=10, blank=True)
    holder_name  = models.CharField(max_length=255)
    billing_email = models.EmailField(blank=True)
    billing_phone = models.CharField(max_length=50, blank=True)
    label        = models.CharField(max_length=255, blank=True)
    is_default   = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.user.username} — {self.label}"

    def to_dict(self):
        return {
            'id':          str(self.pk),
            'type':        self.type,
            'brand':       self.brand,
            'last4':       self.last4,
            'expiryMonth': self.expiry_month,
            'expiryYear':  self.expiry_year,
            'expiryLabel': self.expiry_label,
            'holderName':  self.holder_name,
            'billingEmail': self.billing_email,
            'billingPhone': self.billing_phone,
            'label':       self.label,
            'isDefault':   self.is_default,
            'createdAt':   self.created_at.isoformat(),
            'updatedAt':   self.updated_at.isoformat(),
        }


class Address(models.Model):
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    full_name    = models.CharField(max_length=255)
    address1     = models.CharField(max_length=512)
    address2     = models.CharField(max_length=512, blank=True)
    city         = models.CharField(max_length=255)
    state_region = models.CharField(max_length=255, blank=True)
    postal_code  = models.CharField(max_length=50, blank=True)
    country      = models.CharField(max_length=100, default='Rwanda')
    phone        = models.CharField(max_length=50, blank=True)
    is_default   = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.user.username} — {self.full_name}, {self.city}"

    def to_dict(self):
        return {
            'id':          str(self.pk),
            'fullName':    self.full_name,
            'addressLine1': self.address1,
            'addressLine2': self.address2,
            'city':        self.city,
            'stateRegion': self.state_region,
            'postalCode':  self.postal_code,
            'country':     self.country,
            'phone':       self.phone,
            'isDefault':   self.is_default,
            'createdAt':   self.created_at.isoformat(),
            'updatedAt':   self.updated_at.isoformat(),
        }
