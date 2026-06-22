import json
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_http_methods
from .models import UserProfile


def _build_user_data(user):
    """Return a consistent user dict including gender from profile."""
    display_name = user.first_name if user.first_name else user.username
    if user.first_name and user.last_name:
        display_name = f"{user.first_name} {user.last_name}"

    profile, _ = UserProfile.objects.get_or_create(user=user)

    return {
        'id': user.id,
        'email': user.email,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'displayName': display_name,
        'phone': "" if "@" in user.username else user.username,
        'gender': profile.gender,
    }

def login_view(request):
    return render(request, 'accounts/login.html')

def signup_view(request):
    return render(request, 'accounts/signUp.html')

@login_required
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

        if not request.session.session_key:
            request.session.save()
        token = request.session.session_key

        return JsonResponse({
            'token': token,
            'user': _build_user_data(user),
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
        full_name = data.get('fullName', '').strip()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'error': 'Invalid request payload.'}, status=400)

    if not identifier or not password:
        return JsonResponse({'error': 'Enter your email or phone number and password.'}, status=400)

    if not full_name:
        return JsonResponse({'error': 'Please enter your full name.'}, status=400)

    if len(password) < 6:
        return JsonResponse({'error': 'Password must be at least 6 characters long.'}, status=400)

    if User.objects.filter(username=identifier).exists():
        return JsonResponse({'error': 'An account with this email/phone number already exists.'}, status=400)

    try:
        # Split full name into first / last
        name_parts = full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        email = identifier if "@" in identifier else ""
        user = User.objects.create_user(
            username=identifier,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        login(request, user)

        if not request.session.session_key:
            request.session.save()
        token = request.session.session_key

        return JsonResponse({
            'token': token,
            'user': _build_user_data(user),
            'message': 'Account created successfully! Redirecting...'
        })
    except Exception as e:
        return JsonResponse({'error': f'Failed to create account: {str(e)}'}, status=500)

@csrf_exempt
def api_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Your session expired. Sign in again to continue.'}, status=401)

    user = request.user

    if request.method == 'GET':
        return JsonResponse({'user': _build_user_data(user)})

    elif request.method == 'PATCH':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

        first_name = data.get('firstName')
        last_name  = data.get('lastName')
        email      = data.get('email')
        gender     = data.get('gender')

        if first_name is not None:
            user.first_name = first_name.strip()
        if last_name is not None:
            user.last_name = last_name.strip()
        if email is not None:
            user.email = email.strip()
            if '@' in user.username:
                user.username = email.strip()

        user.save()

        if gender is not None:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.gender = gender.strip()
            profile.save()

        return JsonResponse({
            'user': _build_user_data(user),
            'message': 'Profile details saved.'
        })

    return JsonResponse({'error': 'Method not allowed.'}, status=405)


@csrf_exempt
@require_http_methods(['POST', 'GET'])
def api_logout(request):
    logout(request)
    return JsonResponse({'message': 'Logged out successfully.'})

