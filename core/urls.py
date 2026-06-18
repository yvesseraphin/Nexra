from django.contrib import admin
from django.urls import path, include
from accounts import views as accounts_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')),
    path('accounts/', include('accounts.urls')),
    # Since cart is another app, route it to cart.urls
    path('cart/', include('cart.urls')),
    
    # Auth API endpoints
    path('api/auth/login/', accounts_views.api_login, name='api_login'),
    path('api/auth/signup/', accounts_views.api_signup, name='api_signup'),
    path('api/profile/', accounts_views.api_profile, name='api_profile'),
]
