from django.contrib import admin
from .models import Subscriber

@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display  = ('email', 'subscribed_at', 'is_active')
    list_filter   = ('is_active',)
    search_fields = ('email',)
    readonly_fields = ('subscribed_at',)

# Other store models will be registered here as they are added
