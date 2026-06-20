from django.contrib import admin
from django.urls import path, include
from accounts import views as accounts_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')),
    path('accounts/', include('accounts.urls')),
    path('cart/', include('cart.urls')),

    # Auth API
    path('api/auth/login/',  accounts_views.api_login,   name='api_login'),
    path('api/auth/signup/', accounts_views.api_signup,  name='api_signup'),
    path('api/auth/logout/', accounts_views.api_logout,  name='api_logout'),
    path('api/profile/',     accounts_views.api_profile, name='api_profile'),
]
