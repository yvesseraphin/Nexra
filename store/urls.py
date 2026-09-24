from django.urls import path
from . import views

urlpatterns = [

    path('', views.home, name='home'),
    path('index.html', views.home),
    path('store/food/', views.food, name='food'),
    path('store/tech/', views.tech, name='tech'),
    path('store/fashion/', views.fashion, name='fashion'),
    path('store/beauty/', views.beauty, name='beauty'),
    path('store/kids/', views.kids, name='kids'),
    path('store/accessories/', views.accessories, name='accessories'),
    path('store/product/', views.product, name='product'),

    path('api/pages/<str:slug>', views.api_page_data, name='api_page_data'),
    path('api/catalog/items/<str:slug>', views.api_catalog_item, name='api_catalog_item'),
    path('api/catalog/search/', views.api_search_products, name='api_search_products'),
    path('api/catalog/items/<str:slug>/reviews/', views.api_product_reviews, name='api_product_reviews'),
    path('api/subscribe/', views.api_subscribe, name='api_subscribe'),
]
