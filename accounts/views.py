import json
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

def login_view(request):
    return render(request, 'accounts/login.html')

def signup_view(request):
    return render(request, 'accounts/signUp.html')

def profile_view(request):
    return render(request, 'accounts/profile.html')

@csrf_exempt
@require_POST
def api_login(request):
    try:
        data = json.loads(request.body)
        identifier = data.get('identifier', '').strip()
        password = data.get('password', '')
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'error': 'Invalid request payload.'}, status=400)

    if not identifier or not password:
        return JsonResponse({'error': 'Enter your email or phone number and password.'}, status=400)

    user = authenticate(request, username=identifier, password=password)

    if user is not None:
        login(request, user)
        
        display_name = user.first_name if user.first_name else user.username
        if user.first_name and user.last_name:
            display_name = f"{user.first_name} {user.last_name}"

        user_data = {
            'id': user.id,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'displayName': display_name,
            'phone': "" if "@" in user.username else user.username
        }

        if not request.session.session_key:
            request.session.save()
        token = request.session.session_key
        
        return JsonResponse({
            'token': token,
            'user': user_data,
            'message': 'Login successful. Redirecting...'
        })
    else:
        return JsonResponse({'error': 'Invalid email/phone number or password.'}, status=400)

@csrf_exempt
@require_POST
def api_signup(request):
    try:
        data = json.loads(request.body)
        identifier = data.get('identifier', '').strip()
        password = data.get('password', '')
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'error': 'Invalid request payload.'}, status=400)

    if not identifier or not password:
        return JsonResponse({'error': 'Enter your email or phone number and password.'}, status=400)

    if len(password) < 6:
        return JsonResponse({'error': 'Password must be at least 6 characters long.'}, status=400)

    if User.objects.filter(username=identifier).exists():
        return JsonResponse({'error': 'An account with this email/phone number already exists.'}, status=400)

    try:
        email = identifier if "@" in identifier else ""
        user = User.objects.create_user(username=identifier, email=email, password=password)
        login(request, user)
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'firstName': '',
            'lastName': '',
            'displayName': user.username,
            'phone': "" if "@" in user.username else user.username
        }

        if not request.session.session_key:
            request.session.save()
        token = request.session.session_key

        return JsonResponse({
            'token': token,
            'user': user_data,
            'message': 'Account created successfully! Redirecting...'
        })
    except Exception as e:
        return JsonResponse({'error': f'Failed to create account: {str(e)}'}, status=500)
