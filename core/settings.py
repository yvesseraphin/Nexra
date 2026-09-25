import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='GFOtJf69EU3-DbpRLsAJ3l940diXFlYfHDjGO1Krs4O9She9UghHyoSzHlPj7Ytq_Vo')

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

CSRF_TRUSTED_ORIGINS = [
    'https://*.vercel.app',
    'https://*.now.sh',
    'http://127.0.0.1',
    'http://localhost',
]

LOGIN_URL = '/accounts/login/'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'store',
    'accounts',
    'cart',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

db_file = BASE_DIR / 'db.sqlite3'
if os.environ.get('VERCEL'):
    import shutil
    tmp_db = Path('/tmp/db.sqlite3')
    if not tmp_db.exists() and db_file.exists():
        try:
            shutil.copyfile(db_file, tmp_db)
        except Exception:
            pass
    if tmp_db.exists():
        db_file = tmp_db

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': db_file,
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

STATIC_ROOT = BASE_DIR / 'staticfiles'
try:
    import whitenoise
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
    WHITENOISE_USE_FINDERS = True
    WHITENOISE_MANIFEST_STRICT = False
except ImportError:
    pass

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

EMAIL_BACKEND       = config('EMAIL_BACKEND',       default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST          = config('EMAIL_HOST',           default='smtp.gmail.com')
EMAIL_PORT          = config('EMAIL_PORT',           default=587, cast=int)
EMAIL_USE_TLS       = config('EMAIL_USE_TLS',        default=True, cast=bool)
EMAIL_HOST_USER     = config('EMAIL_HOST_USER',      default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD',  default='')
DEFAULT_FROM_EMAIL  = config('DEFAULT_FROM_EMAIL',   default=EMAIL_HOST_USER)
