# Nexra

Nexra is a Django ecommerce web application with category browsing, account pages, a cart interface, static product data, and JSON endpoints for store content.

The project is in active development. The current version focuses on the storefront experience and the backend foundation that will later support database-driven products, carts, and orders.

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Routes](#routes)
- [API Endpoints](#api-endpoints)
- [Roadmap](#roadmap)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Features

- Ecommerce homepage with product highlights.
- Category pages for food, tech, fashion, beauty, kids, and accessories.
- Product detail page template.
- Cart page interface.
- Login, signup, and profile pages.
- JSON API endpoints for page catalog data.
- JSON API endpoint for individual catalog items.
- Static image, CSS, and JavaScript assets for the storefront UI.

## Tech Stack

- Python
- Django
- SQLite for local development
- HTML
- CSS
- JavaScript

## Project Structure

```text
Nexra/
|-- accounts/         # Account pages and authentication API views
|-- cart/             # Cart page app
|-- core/             # Django settings, ASGI/WSGI, and root URLs
|-- static/           # CSS, JavaScript, and image assets
|   |-- css/
|   |-- images/
|   `-- js/
|-- store/            # Store pages and catalog API views
|-- templates/        # Django templates
|   |-- accounts/
|   |-- cart/
|   `-- store/
|-- .gitignore
|-- README.md
`-- manage.py
```

## Getting Started

### Prerequisites

- Python 3.10 or newer
- pip
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/myvesseraphin/Nexra.git
cd Nexra
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS or Linux:

```bash
source .venv/bin/activate
```

Install Django:

```bash
pip install django
```

Apply migrations:

```bash
python manage.py migrate
```

Run the development server:

```bash
python manage.py runserver
```

Open the app:

```text
http://127.0.0.1:8000/
```

## Configuration

The project currently uses development settings in `core/settings.py`.

For production or shared deployments, move sensitive settings into environment variables:

```env
SECRET_KEY=your-secure-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

Local-only files such as `.env`, SQLite databases, logs, virtual environments, editor settings, and Python cache files are ignored by `.gitignore`.

## Routes

### Store Pages

| Route | Description |
| --- | --- |
| `/` | Homepage |
| `/index.html` | Homepage alias |
| `/store/food/` | Food category page |
| `/store/tech/` | Tech category page |
| `/store/fashion/` | Fashion category page |
| `/store/beauty/` | Beauty category page |
| `/store/kids/` | Kids category page |
| `/store/accessories/` | Accessories category page |
| `/store/product/` | Product detail page |

### Account And Cart Pages

| Route | Description |
| --- | --- |
| `/accounts/login/` | Login page |
| `/accounts/signup/` | Signup page |
| `/accounts/profile/` | User profile page |
| `/cart/` | Shopping cart page |
| `/admin/` | Django admin |

## API Endpoints

### Get Page Data

```http
GET /api/pages/<slug>
```

Supported slugs:

- `index`
- `food`
- `tech`
- `fashion`
- `beauty`
- `kids`
- `accessories`

Example:

```http
GET /api/pages/tech
```

### Get Catalog Item Data

```http
GET /api/catalog/items/<slug>
```

Catalog item slugs are generated from the page slug and item title.

Example:

```text
tech-lg-smart-tv
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

### Signup

```http
POST /api/auth/signup
Content-Type: application/json
```

```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

## Roadmap

- Add database models for products, categories, carts, and orders.
- Replace static catalog data with database-backed content.
- Add a dependency file such as `requirements.txt`.
- Add automated tests.
- Improve authentication and account management.
- Add admin workflows for products and orders.
- Prepare separate production settings.

## Security

Before deploying this project:

- Use a secure `SECRET_KEY`.
- Set `DEBUG=False`.
- Restrict `ALLOWED_HOSTS`.
- Store secrets in environment variables.
- Review CSRF handling for API endpoints.
- Avoid committing databases, credentials, keys, or local configuration files.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes.
4. Test locally.
5. Open a pull request with a clear description.

## License

No license has been selected yet.
