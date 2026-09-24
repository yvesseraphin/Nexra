import json
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth.models import User
from store.models import Subscriber, Category, Product, ProductReview

class StoreCatalogTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='reviewer@example.com',
            email='reviewer@example.com',
            password='ReviewerPass123!'
        )
        self.category = Category.objects.create(name='Tech', slug='tech')
        self.product = Product.objects.create(
            category=self.category,
            title='Samsung 4K Monitor',
            slug='tech-samsung-4k-monitor',
            description='Ultra-sharp display for professionals',
            full_description='High dynamic range with vibrant colors.',
            price='350 000 RWF',
            price_value=Decimal('350000'),
            image='images/s7.png',
            page='tech',
            stock=15
        )

    def test_pages_render(self):
        routes = ['/', '/store/tech/', '/store/food/', '/store/fashion/', '/store/beauty/', '/store/kids/', '/store/accessories/', '/store/product/']
        for route in routes:
            response = self.client.get(route)
            self.assertEqual(response.status_code, 200, f"Route {route} failed")

    def test_api_page_data(self):
        response = self.client.get('/api/pages/tech')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('sections', data)

    def test_api_catalog_item(self):
        response = self.client.get(f'/api/catalog/items/{self.product.slug}')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['title'], 'Samsung 4K Monitor')
        self.assertEqual(data['stock'], 15)

    def test_api_search_products(self):
        response = self.client.get('/api/catalog/search/?q=Samsung')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data['count'], 1)
        self.assertTrue(any('Samsung' in p['title'] for p in data['results']))

    def test_newsletter_subscribe(self):
        res = self.client.post(
            '/api/subscribe/',
            data=json.dumps({'email': 'newsub@example.com'}),
            content_type='application/json'
        )
        self.assertIn(res.status_code, (200, 201))
        self.assertTrue(Subscriber.objects.filter(email='newsub@example.com').exists())

    def test_product_reviews(self):
        self.client.login(username='reviewer@example.com', password='ReviewerPass123!')

        post_res = self.client.post(
            f'/api/catalog/items/{self.product.slug}/reviews/',
            data=json.dumps({
                'rating': 5,
                'comment': 'Phenomenal picture clarity and sleek build quality!'
            }),
            content_type='application/json'
        )
        self.assertEqual(post_res.status_code, 201)
        self.assertEqual(ProductReview.objects.filter(product=self.product).count(), 1)

        get_res = self.client.get(f'/api/catalog/items/{self.product.slug}/reviews/')
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(len(get_res.json()['reviews']), 1)
