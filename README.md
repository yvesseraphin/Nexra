# Nexra

A full-stack e-commerce web application built with Django. Nexra covers the complete shopping experience — browsing categories, viewing product details, managing a cart, placing orders, and managing an account — backed by a REST-style JSON API.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Routes](#routes)
- [API Reference](#api-reference)
- [Admin Panel](#admin-panel)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Storefront** — Homepage, six category pages (Food, Tech, Fashion, Beauty, Kids, Accessories), and a product detail page with dynamic catalog loading from a JSON API.
- **Authentication** — Session-based login and signup using email or phone number. Profile is protected server-side with `@login_required`.
- **User Profile** — Edit name, email, gender (persisted to a `UserProfile` model). Gender dropdown restores on next login.
- **Cart** — Add, remove, and update quantities. Cart is persisted per user in the database. Guest cart migrates to the user account on login.
- **Checkout** — Two-step checkout (shipping → payment) on a dedicated page. Luhn card validation, saved cards, saved addresses, and CVV verification.
- **Orders** — Full order records stored in the database including line items, shipping address, payment summary, and status.
- **Coupons** — Apply discount codes at checkout (percentage or fixed amount, min order value, usage limits, expiry dates).
- **Payment Methods** — Save and manage masked card details per user.
- **Address Book** — Save and manage multiple delivery addresses per user.
- **Newsletter** — CTA subscribe form on the homepage. Emails stored in the database, welcome email sent automatically via SMTP.
- **Admin Panel** — All models registered: Orders, CartItems, Coupons, PaymentMethods, Addresses, Subscribers, UserProfiles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, Django 4+ |
| Database | SQLite (development) |
| Frontend | HTML, CSS, Vanilla JavaScript |
| CSS Framework | Bootstrap 5.3 |
| Icons | Boxicons, Font Awesome 6 |
| Fonts | Google Fonts — Outfit |
| Email | Django `send_mail` via SMTP (Gmail-ready) |
| Config | `python-decouple` — `.env` file |

---

## Project Structure

```text
Nexra/
├── accounts/               # Auth views, UserProfile model, login/signup/profile pages
│   ├── migrations/
│   ├── models.py           # UserProfile (gender)
│   ├── views.py            # login, signup, profile API, logout
│   └── urls.py
├── cart/                   # Cart, orders, payment methods, addresses, coupons
│   ├── migrations/
│   ├── models.py           # CartItem, Order, OrderItem, PaymentMethod, Address, Coupon
│   ├── views.py            # Full REST API for all cart/order resources
│   ├── urls.py
│   └── admin.py
├── store/                  # Storefront pages, catalog API, newsletter
│   ├── migrations/
│   ├── models.py           # Subscriber
│   ├── views.py            # Page views, catalog API, subscribe API
│   ├── urls.py
│   └── admin.py
├── core/                   # Django project config
│   ├── settings.py         # All settings, reads from .env
│   ├── urls.py             # Root URL router
│   ├── asgi.py
│   └── wsgi.py
├── templates/
│   ├── base.html           # Shared layout, navbar, footer
│   ├── index.html          # Homepage
│   ├── accounts/           # login.html, signUp.html, profile.html
│   ├── cart/               # cart.html, checkout.html
│   └── store/              # food, tech, fashion, beauty, kids, accessories, product
├── static/
│   ├── css/                # Per-page and global stylesheets
│   ├── js/                 # global-state.js, navbar, notify, cart, checkout, store, auth
│   └── images/
├── .env                    # Local secrets — never committed
├── .gitignore
├── manage.py
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10 or newer
- pip
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yvesseraphin/Nexra.git
cd Nexra
```

**2. Create and activate a virtual environment**

```bash
python -m venv .venv
```

Windows (PowerShell):
```powershell
.\.venv\Scripts\Activate.ps1
```

macOS / Linux:
```bash
source .venv/bin/activate
```

**3. Install dependencies**

```bash
pip install django python-decouple
```

**4. Create your `.env` file**

```bash
copy .env.example .env   # Windows
cp .env.example .env     # macOS / Linux
```

Then fill in your values (see [Environment Variables](#environment-variables)).

**5. Apply migrations**

```bash
python manage.py migrate
```

**6. Create a superuser** (optional — for admin access)

```bash
python manage.py createsuperuser
```

**7. Run the development server**

```bash
python manage.py runserver
```

Visit: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Environment Variables

Create a `.env` file in the project root. All variables are read by `python-decouple`.

```env
# Django
SECRET_KEY=your-long-random-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Email (SMTP — used for newsletter welcome emails)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=Nexra <your-email@gmail.com>
```

> **Gmail users:** generate an [App Password](https://myaccount.google.com/apppasswords) — do not use your regular Gmail password.

> To test locally without sending real emails, set `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` — emails will print to the terminal instead.

---

## Routes

### Store Pages

| Route | Description |
|---|---|
| `/` | Homepage |
| `/store/food/` | Food category |
| `/store/tech/` | Tech category |
| `/store/fashion/` | Fashion category |
| `/store/beauty/` | Beauty category |
| `/store/kids/` | Kids category |
| `/store/accessories/` | Accessories category |
| `/store/product/?slug=<slug>` | Product detail page |

### Account Pages

| Route | Description |
|---|---|
| `/accounts/login/` | Login |
| `/accounts/signup/` | Sign up |
| `/accounts/profile/` | Profile (requires login) |

### Cart Pages

| Route | Description |
|---|---|
| `/cart/` | Shopping cart |
| `/cart/checkout/` | Checkout |

---

## API Reference

All API endpoints return JSON. Cart and order endpoints require an active session (login first).

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login/` | Login with email or phone + password |
| `POST` | `/api/auth/signup/` | Create account |
| `POST` | `/api/auth/logout/` | Logout |
| `GET` | `/api/profile/` | Get current user profile |
| `PATCH` | `/api/profile/` | Update name, email, gender |

**Login / Signup body:**
```json
{
  "identifier": "user@example.com",
  "password": "password123",
  "fullName": "Jane Doe"
}
```

---

### Store

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/pages/<slug>` | Full section data for a storefront page |
| `GET` | `/api/catalog/items/<slug>` | Single product by slug |
| `POST` | `/api/subscribe/` | Subscribe to newsletter |

**Supported page slugs:** `index`, `tech`, `food`, `fashion`, `beauty`, `kids`, `accessories`

**Subscribe body:**
```json
{ "email": "user@example.com" }
```

---

### Cart

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cart/api/cart/` | Get all cart items |
| `POST` | `/cart/api/cart/` | Add item to cart |
| `DELETE` | `/cart/api/cart/` | Clear entire cart |
| `PATCH` | `/cart/api/cart/<product_id>/` | Update item quantity |
| `DELETE` | `/cart/api/cart/<product_id>/` | Remove item |

---

### Orders

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cart/api/orders/` | List user orders |
| `POST` | `/cart/api/orders/` | Place an order |
| `GET` | `/cart/api/orders/<id>/` | Get order detail |

---

### Payment Methods

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cart/api/payments/` | List saved cards |
| `POST` | `/cart/api/payments/` | Add a new card |
| `PATCH` | `/cart/api/payments/<id>/` | Set as default |
| `DELETE` | `/cart/api/payments/<id>/` | Remove card |

---

### Addresses

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cart/api/addresses/` | List saved addresses |
| `POST` | `/cart/api/addresses/` | Add address |
| `PATCH` | `/cart/api/addresses/<id>/` | Update / set default |
| `DELETE` | `/cart/api/addresses/<id>/` | Remove address |

---

### Coupons

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/cart/api/coupon/apply/` | Validate and apply a coupon code |

**Body:**
```json
{ "code": "SAVE20", "subtotal": 50000 }
```

---

## Admin Panel

Access at `/admin/` after creating a superuser.

Registered models:

- `Order` + inline `OrderItem`
- `CartItem`
- `Coupon`
- `PaymentMethod`
- `Address`
- `Subscriber`
- `UserProfile` (via accounts app)

---

## Security Notes

Before deploying to production:

- Set `DEBUG=False` in `.env`
- Use a long, random `SECRET_KEY`
- Set `ALLOWED_HOSTS` to your domain only
- Enable `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`
- Switch from SQLite to PostgreSQL or another production database
- Store all credentials in `.env` — never commit them
- Use a real App Password for Gmail, not your account password

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

---

## License

This project does not currently have a license. All rights reserved.
