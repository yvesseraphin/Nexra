from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify

class Subscriber(models.Model):
    email         = models.EmailField(unique=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active     = models.BooleanField(default=True)

    class Meta:
        ordering = ['-subscribed_at']

    def __str__(self):
        return self.email

class Category(models.Model):
    name        = models.CharField(max_length=100)
    slug        = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image       = models.CharField(max_length=255, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Product(models.Model):
    category         = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    title            = models.CharField(max_length=255)
    slug             = models.SlugField(max_length=255, unique=True)
    description      = models.CharField(max_length=512, blank=True)
    full_description = models.TextField(blank=True)
    price            = models.CharField(max_length=100)
    price_value      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    image            = models.CharField(max_length=512)
    alt              = models.CharField(max_length=255, blank=True)
    section          = models.CharField(max_length=100, blank=True)
    page             = models.CharField(max_length=100, blank=True)
    stock            = models.PositiveIntegerField(default=50)
    is_featured      = models.BooleanField(default=False)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def to_dict(self):
        return {
            'id': self.slug,
            'slug': self.slug,
            'title': self.title,
            'alt': self.alt or self.title,
            'description': self.description,
            'fullDescription': self.full_description,
            'price': self.price,
            'priceValue': float(self.price_value),
            'image': self.image,
            'page': self.page,
            'stock': self.stock,
            'category': self.category.name if self.category else '',
        }

class ProductReview(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating     = models.PositiveSmallIntegerField(default=5)
    comment    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.title} ({self.rating}*)"
