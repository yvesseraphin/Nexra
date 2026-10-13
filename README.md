# Nexra

Nexra is a Django e-commerce application for browsing a multi-category storefront, managing customer accounts and carts, and placing orders. The interface is built with Django templates, CSS, and vanilla JavaScript; Django provides the page views and JSON endpoints.

## Features

- Storefront pages for food, technology, fashion, beauty, kids, and accessories
- Product detail pages, catalog search, and product reviews
- Session-based sign-up, login, profiles, and profile images
- Persistent carts, checkout, orders, saved payment methods, and delivery addresses
- Coupon support and newsletter subscriptions
- Django admin for application data

## Technology

- Python 3.10 or newer
- Django 5 or newer (less than 7)
- SQLite by default
- Django templates, CSS, and vanilla JavaScript
- WhiteNoise for static files
- `python-decouple` for environment configuration
- Pillow for image handling

## Project layout

```text
accounts/       Account views, models, and migrations
cart/           Cart, checkout, order, and payment functionality
core/           Django project settings and URL configuration
static/         CSS, JavaScript, and storefront images
store/          Store pages, catalog APIs, and catalog seed command
templates/      Shared layout and page templates
manage.py       Django management entry point
requirements.txt
vercel.json     Vercel deployment configuration
```

## Local setup

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/yvesseraphin/Nexra.git
   cd Nexra
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   ```

   Windows PowerShell:

   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

   macOS or Linux:

   ```bash
   source .venv/bin/activate
   ```

3. Install the project dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root. At minimum, set a private `SECRET_KEY` and configure `DEBUG` and `ALLOWED_HOSTS` for your environment. Email settings are optional unless you want newsletter welcome emails to be sent through SMTP. See [Environment configuration](#environment-configuration).

5. Apply database migrations and start the development server:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

   Open <http://127.0.0.1:8000/>. To access Django admin, create an administrator with `python manage.py createsuperuser`, then visit `/admin/`.

To populate or refresh catalog records from the catalog data in `store/views.py`, run:

```bash
python manage.py seed_catalog
```

## Environment configuration

The application reads configuration from environment variables and an optional root `.env` file. Example values:

```dotenv
SECRET_KEY=replace-with-a-long-random-secret
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-mail-provider-app-password
DEFAULT_FROM_EMAIL=Nexra <your-email@example.com>
```

For local email previews, use Django's console email backend:

```dotenv
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

Keep `.env` and its credentials out of version control. The settings module has development defaults, so configure a strong secret key, `DEBUG=False`, and a restricted `ALLOWED_HOSTS` before deployment.

## Pages and endpoints

### Pages

| Path | Description |
|---|---|
| `/` | Home page |
| `/store/food/` | Food category |
| `/store/tech/` | Technology category |
| `/store/fashion/` | Fashion category |
| `/store/beauty/` | Beauty category |
| `/store/kids/` | Kids category |
| `/store/accessories/` | Accessories category |
| `/store/product/?slug=<slug>` | Product detail |
| `/accounts/login/` | Sign in |
| `/accounts/signup/` | Create an account |
| `/accounts/profile/` | Customer profile |
| `/cart/` | Shopping cart |
| `/cart/checkout/` | Checkout |
| `/admin/` | Django administration |

### JSON APIs

| Path | Purpose |
|---|---|
| `/api/auth/login/`, `/api/auth/signup/`, `/api/auth/logout/` | Account sessions |
| `/api/profile/` and `/api/profile/avatar/` | Profile details and avatar |
| `/api/pages/<slug>` | Store page catalog data |
| `/api/catalog/items/<slug>` | Product details |
| `/api/catalog/search/` | Product search |
| `/api/catalog/items/<slug>/reviews/` | Product reviews |
| `/api/subscribe/` | Newsletter subscription |
| `/cart/api/cart/` | Cart items |
| `/cart/api/orders/` | Customer orders |
| `/cart/api/payments/` | Saved payment methods |
| `/cart/api/addresses/` | Saved delivery addresses |
| `/cart/api/coupon/apply/` | Coupon validation |

Most account-specific cart and order operations use the authenticated session. See `accounts/urls.py`, `cart/urls.py`, `core/urls.py`, and `store/urls.py` for supported methods and full route details.

## Deployment notes

The repository includes a Vercel configuration for the Django WSGI application and static assets. Review the deployment platform's current Python runtime, environment variable, and persistent storage requirements before deploying. The default SQLite database is suitable for local development; use a persistent production database for deployed customer and order data.

## License

No license has been specified. All rights are reserved unless the project owner states otherwise.
