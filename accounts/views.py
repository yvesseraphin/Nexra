import json
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from .models import UserProfile

def _build_user_data(user):
    """Return a consistent user dict including gender and avatar from profile."""
    display_name = user.first_name if user.first_name else user.username
    if user.first_name and user.last_name:
        display_name = f"{user.first_name} {user.last_name}"

    profile, _ = UserProfile.objects.get_or_create(user=user)

    avatar_url = ""
    if profile.avatar:
        try:
            avatar_url = profile.avatar.url
        except Exception:
            avatar_url = ""

    return {
        'id': user.id,
        'email': user.email,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'displayName': display_name,
        'phone': profile.phone or ("" if "@" in user.username else user.username),
        'gender': profile.gender,
        'avatarUrl': avatar_url,
    }

@ensure_csrf_cookie
def login_view(request):
    return render(request, 'accounts/login.html')

@ensure_csrf_cookie
def signup_view(request):
    return render(request, 'accounts/signUp.html')

@ensure_csrf_cookie
def profile_view(request):
    return render(request, 'accounts/profile.html')

@require_POST
def api_login(request):
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict):
            raise ValueError
        identifier = str(data.get('identifier') or '').strip()
        password = str(data.get('password') or '')
    except (json.JSONDecodeError, AttributeError, ValueError):
        return JsonResponse({'error': 'Invalid request payload.'}, status=400)

    if not identifier or not password:
        return JsonResponse({'error': 'Enter your email or phone number and password.'}, status=400)

    user = authenticate(request, username=identifier, password=password)
    if user is None:
        return JsonResponse({'error': 'Invalid email or phone number and password.'}, status=401)

    login(request, user)
    if not request.session.session_key:
        request.session.save()

    return JsonResponse({
        'authenticated': True,
        'user': _build_user_data(user),
        'message': 'Login successful. Redirecting...'
    })

@require_POST
def api_signup(request):
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict):
            raise ValueError
        identifier = str(data.get('identifier') or '').strip()
        password = str(data.get('password') or '')
        full_name = str(data.get('fullName') or '').strip()
    except (json.JSONDecodeError, AttributeError, ValueError):
        return JsonResponse({'error': 'Invalid request payload.'}, status=400)

    if not identifier or not password:
        return JsonResponse({'error': 'Enter your email or phone number and password.'}, status=400)

    if not full_name:
        return JsonResponse({'error': 'Please enter your full name.'}, status=400)

    if len(password) < 6:
        return JsonResponse({'error': 'Password must be at least 6 characters long.'}, status=400)

    if User.objects.filter(username=identifier).exists():
        return JsonResponse({'error': 'An account with these details already exists. Please sign in.'}, status=409)

    name_parts = full_name.split(' ', 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ''
    email = identifier if "@" in identifier else ""

    try:
        user = User.objects.create_user(
            username=identifier,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
    except IntegrityError:
        return JsonResponse({'error': 'An account with these details already exists. Please sign in.'}, status=409)
    except Exception:
        return JsonResponse({'error': 'The account could not be created. Please try again.'}, status=500)

    try:
        login(request, user)
        if not request.session.session_key:
            request.session.save()
    except Exception:
        return JsonResponse({'error': 'The account was created, but sign-in failed. Please sign in.'}, status=500)

    return JsonResponse({
        'authenticated': True,
        'user': _build_user_data(user),
        'message': 'Account created successfully! Redirecting...'
    }, status=201)

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
        phone      = data.get('phone')
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

        profile, _ = UserProfile.objects.get_or_create(user=user)
        if gender is not None:
            profile.gender = gender.strip()
        if phone is not None:
            profile.phone = phone.strip()
        profile.save()

        return JsonResponse({
            'user': _build_user_data(user),
            'message': 'Profile details saved.'
        })

    return JsonResponse({'error': 'Method not allowed.'}, status=405)

@require_POST
def api_avatar_upload(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if 'avatar' not in request.FILES:
        return JsonResponse({'error': 'No image file uploaded.'}, status=400)

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if profile.avatar:
        try:
            profile.avatar.delete(save=False)
        except Exception:
            pass

    profile.avatar = request.FILES['avatar']
    profile.save()

    return JsonResponse({
        'user': _build_user_data(request.user),
        'message': 'Profile photo updated.',
    })

@require_POST
def api_avatar_remove(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if profile.avatar:
        try:
            profile.avatar.delete(save=False)
        except Exception:
            pass
        profile.avatar = None
        profile.save()

    return JsonResponse({
        'user': _build_user_data(request.user),
        'message': 'Profile photo removed.',
    })

@require_POST
def api_change_password(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({'error': 'Invalid request.'}, status=400)

    current_password = data.get('currentPassword', '')
    new_password = data.get('newPassword', '')

    if not current_password or not new_password:
        return JsonResponse({'error': 'Current and new password are required.'}, status=400)

    if not request.user.check_password(current_password):
        return JsonResponse({'error': 'Current password is incorrect.'}, status=400)

    if len(new_password) < 6:
        return JsonResponse({'error': 'New password must be at least 6 characters long.'}, status=400)

    request.user.set_password(new_password)
    request.user.save()
    login(request, request.user)
    return JsonResponse({'message': 'Password changed successfully.'})

@require_POST
def api_logout(request):
    logout(request)
    return JsonResponse({'message': 'Logged out successfully.'})

