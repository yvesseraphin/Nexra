from django.contrib import admin
from django.urls import path, include
from accounts import views as accounts_views

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('store.urls')),
    path('accounts/', include('accounts.urls')),
    path('cart/', include('cart.urls')),

    path('api/auth/login/',  accounts_views.api_login,   name='api_login'),
    path('api/auth/signup/', accounts_views.api_signup,  name='api_signup'),
    path('api/auth/logout/', accounts_views.api_logout,  name='api_logout'),
    path('api/profile/',     accounts_views.api_profile, name='api_profile'),
    path('api/profile/avatar/', accounts_views.api_avatar_upload, name='api_avatar_upload'),
    path('api/profile/avatar/remove/', accounts_views.api_avatar_remove, name='api_avatar_remove'),
    path('api/profile/change-password/', accounts_views.api_change_password, name='api_change_password'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
