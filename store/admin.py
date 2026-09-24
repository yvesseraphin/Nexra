from django.contrib import admin
from .models import Subscriber, Category, Product, ProductReview

@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display    = ('email', 'subscribed_at', 'is_active')
    list_filter     = ('is_active',)
    search_fields   = ('email',)
    readonly_fields = ('subscribed_at',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display        = ('name', 'slug', 'created_at')
    search_fields       = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

class ProductReviewInline(admin.TabularInline):
    model = ProductReview
    extra = 0
    readonly_fields = ('created_at',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display        = ('title', 'category', 'page', 'price', 'price_value', 'stock', 'is_featured', 'created_at')
    list_filter         = ('page', 'category', 'is_featured', 'created_at')
    search_fields       = ('title', 'slug', 'description', 'page')
    prepopulated_fields = {'slug': ('title',)}
    list_editable       = ('price', 'price_value', 'stock', 'is_featured')
    inlines             = [ProductReviewInline]

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display    = ('product', 'user', 'rating', 'created_at')
    list_filter     = ('rating', 'created_at')
    search_fields   = ('product__title', 'user__username', 'comment')
    readonly_fields = ('created_at',)
