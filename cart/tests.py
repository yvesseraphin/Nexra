import json
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth.models import User
from cart.models import CartItem, Order, OrderItem, Coupon, PaymentMethod, Address

class CartAndCheckoutTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='shopper@example.com',
            email='shopper@example.com',
            password='ShopperPass123!',
            first_name='Alex',
            last_name='Kagabo'
        )
        self.client.login(username='shopper@example.com', password='ShopperPass123!')

        self.coupon = Coupon.objects.create(
            code='SAVE20',
            description='20% discount',
            discount_type='percent',
            discount_value=20,
            min_order_value=10000,
            is_active=True
        )

    def test_cart_crud(self):

        add_res = self.client.post(
            '/cart/api/cart/',
            data=json.dumps({
                'id': 'tech-dell-laptop',
                'slug': 'tech-dell-laptop',
                'title': 'Dell XPS 15',
                'price': '800 000 RWF',
                'priceValue': 800000,
                'quantity': 1,
            }),
            content_type='application/json'
        )
        self.assertIn(add_res.status_code, (200, 201))
        cart_data = add_res.json()['cart']
        self.assertEqual(len(cart_data), 1)
        self.assertEqual(cart_data[0]['id'], 'tech-dell-laptop')

        patch_res = self.client.patch(
            '/cart/api/cart/tech-dell-laptop/',
            data=json.dumps({'quantity': 3}),
            content_type='application/json'
        )
        self.assertEqual(patch_res.status_code, 200)
        self.assertEqual(patch_res.json()['cart'][0]['quantity'], 3)

        del_res = self.client.delete('/cart/api/cart/tech-dell-laptop/')
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(len(del_res.json()['cart']), 0)

    def test_coupon_application(self):

        low_res = self.client.post(
            '/cart/api/coupon/apply/',
            data=json.dumps({'code': 'SAVE20', 'subtotal': 5000}),
            content_type='application/json'
        )
        self.assertEqual(low_res.status_code, 400)

        valid_res = self.client.post(
            '/cart/api/coupon/apply/',
            data=json.dumps({'code': 'SAVE20', 'subtotal': 50000}),
            content_type='application/json'
        )
        self.assertEqual(valid_res.status_code, 200)
        c_data = valid_res.json()['coupon']
        self.assertEqual(c_data['code'], 'SAVE20')
        self.assertEqual(c_data['discountAmount'], 10000.0)

    def test_order_creation_and_email(self):

        CartItem.objects.create(
            user=self.user,
            product_id='tech-headset',
            slug='tech-headset',
            title='Wireless Headset',
            price='40 000 RWF',
            price_value=Decimal('40000'),
            quantity=2
        )

        order_res = self.client.post(
            '/cart/api/orders/',
            data=json.dumps({
                'couponCode': 'SAVE20',
                'contact': {
                    'fullName': 'Alex Kagabo',
                    'email': 'shopper@example.com',
                    'phone': '+250788999888'
                },
                'shippingAddress': {
                    'fullName': 'Alex Kagabo',
                    'addressLine1': 'KG 9 Ave 15',
                    'city': 'Kigali',
                    'country': 'Rwanda'
                },
                'paymentSummary': {
                    'brand': 'Visa',
                    'last4': '4242',
                    'expiryLabel': '12/28',
                    'holderName': 'Alex Kagabo'
                },
                'saveAddress': True
            }),
            content_type='application/json'
        )
        self.assertEqual(order_res.status_code, 201)
        order_data = order_res.json()['order']
        self.assertTrue(order_data['orderNumber'].startswith('NXR-'))

        self.assertEqual(order_data['subtotal'], 80000.0)
        self.assertEqual(order_data['couponDiscount'], 16000.0)
        self.assertEqual(order_data['total'], 69000.0)

        self.assertEqual(CartItem.objects.filter(user=self.user).count(), 0)

        detail_res = self.client.get(f"/cart/api/orders/{order_data['id']}/")
        self.assertEqual(detail_res.status_code, 200)

        cancel_res = self.client.patch(
            f"/cart/api/orders/{order_data['id']}/",
            data=json.dumps({'action': 'cancel'}),
            content_type='application/json'
        )
        self.assertEqual(cancel_res.status_code, 200)
        self.assertEqual(cancel_res.json()['order']['status'], 'Cancelled')

    def test_payment_methods_and_addresses(self):

        addr_res = self.client.post(
            '/cart/api/addresses/',
            data=json.dumps({
                'fullName': 'Alex Kagabo',
                'addressLine1': 'KK 15 Rd',
                'city': 'Kigali',
                'country': 'Rwanda',
                'isDefault': True
            }),
            content_type='application/json'
        )
        self.assertEqual(addr_res.status_code, 201)
        addr_id = addr_res.json()['address']['id']

        list_addr = self.client.get('/cart/api/addresses/')
        self.assertEqual(len(list_addr.json()['addresses']), 1)

        pm_res = self.client.post(
            '/cart/api/payments/',
            data=json.dumps({
                'cardNumber': '4242424242424242',
                'holderName': 'Alex Kagabo',
                'expiryMonth': '11',
                'expiryYear': '2028',
                'isDefault': True
            }),
            content_type='application/json'
        )
        self.assertEqual(pm_res.status_code, 201)
        pm_id = pm_res.json()['paymentMethod']['id']

        del_addr = self.client.delete(f'/cart/api/addresses/{addr_id}/')
        self.assertEqual(del_addr.status_code, 200)

        del_pm = self.client.delete(f'/cart/api/payments/{pm_id}/')
        self.assertEqual(del_pm.status_code, 200)
