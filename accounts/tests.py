import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from accounts.models import UserProfile

class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser@example.com',
            email='testuser@example.com',
            password='Password123!',
            first_name='Jane',
            last_name='Doe'
        )

    def test_login_success(self):
        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({
                'identifier': 'testuser@example.com',
                'password': 'Password123!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('token', data)
        self.assertEqual(data['user']['email'], 'testuser@example.com')

    def test_login_invalid_credentials(self):
        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({
                'identifier': 'testuser@example.com',
                'password': 'WrongPassword'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)

    def test_signup_success(self):
        response = self.client.post(
            '/api/auth/signup/',
            data=json.dumps({
                'identifier': 'newuser@example.com',
                'password': 'SecurePassword123',
                'fullName': 'Alice Wonderland'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('token', data)
        self.assertTrue(User.objects.filter(username='newuser@example.com').exists())

    def test_signup_duplicate_fails(self):
        response = self.client.post(
            '/api/auth/signup/',
            data=json.dumps({
                'identifier': 'testuser@example.com',
                'password': 'AnotherPassword123',
                'fullName': 'Duplicate Jane'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_profile_get_and_patch(self):
        self.client.login(username='testuser@example.com', password='Password123!')

        get_res = self.client.get('/api/profile/')
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()['user']['firstName'], 'Jane')

        patch_res = self.client.patch(
            '/api/profile/',
            data=json.dumps({
                'firstName': 'Janet',
                'lastName': 'Smith',
                'gender': 'Female',
                'phone': '+250788123456'
            }),
            content_type='application/json'
        )
        self.assertEqual(patch_res.status_code, 200)
        user_data = patch_res.json()['user']
        self.assertEqual(user_data['firstName'], 'Janet')
        self.assertEqual(user_data['gender'], 'Female')
        self.assertEqual(user_data['phone'], '+250788123456')

    def test_change_password(self):
        self.client.login(username='testuser@example.com', password='Password123!')
        response = self.client.post(
            '/api/profile/change-password/',
            data=json.dumps({
                'currentPassword': 'Password123!',
                'newPassword': 'NewStrongPassword456!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        self.client.logout()
        login_res = self.client.post(
            '/api/auth/login/',
            data=json.dumps({
                'identifier': 'testuser@example.com',
                'password': 'NewStrongPassword456!'
            }),
            content_type='application/json'
        )
        self.assertEqual(login_res.status_code, 200)

    def test_logout(self):
        self.client.login(username='testuser@example.com', password='Password123!')
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, 200)
