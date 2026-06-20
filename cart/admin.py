from django.contrib import admin
from .models import CartItem, Order, OrderItem, PaymentMethod, Address


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_id', 'slug', 'title', 'price', 'price_value', 'quantity', 'page')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ('order_number', 'user', 'status', 'total', 'total_items', 'placed_at')
    list_filter   = ('status', 'placed_at')
    search_fields = ('order_number', 'user__username', 'user__email', 'contact_full_name')
    readonly_fields = ('order_number', 'placed_at', 'updated_at', 'subtotal', 'shipping_cost', 'total', 'total_items')
    inlines       = [OrderItemInline]
    ordering      = ('-placed_at',)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display  = ('user', 'title', 'quantity', 'price_value', 'added_at')
    search_fields = ('user__username', 'title', 'product_id')
    ordering      = ('-added_at',)


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display  = ('user', 'label', 'brand', 'last4', 'is_default', 'created_at')
    search_fields = ('user__username', 'holder_name', 'last4')
    list_filter   = ('brand', 'is_default')


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display  = ('user', 'full_name', 'city', 'country', 'is_default')
    search_fields = ('user__username', 'full_name', 'city')
    list_filter   = ('country', 'is_default')
