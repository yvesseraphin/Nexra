from django.urls import path
from . import views

urlpatterns = [
    # Page views
    path('', views.cart_view, name='cart'),
    path('checkout/', views.checkout_view, name='checkout'),

    # Cart API
    path('api/cart/', views.api_cart, name='api_cart'),
    path('api/cart/<str:product_id>/', views.api_cart_item, name='api_cart_item'),

    # Orders API
    path('api/orders/', views.api_orders, name='api_orders'),
    path('api/orders/<int:order_id>/', views.api_order_detail, name='api_order_detail'),

    # Payment Methods API
    path('api/payments/', views.api_payments, name='api_payments'),
    path('api/payments/<int:pm_id>/', views.api_payment_detail, name='api_payment_detail'),

    # Addresses API
    path('api/addresses/', views.api_addresses, name='api_addresses'),
    path('api/addresses/<int:addr_id>/', views.api_address_detail, name='api_address_detail'),
]
