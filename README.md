# Nexra

Nexra is a Django-based ecommerce web application for browsing product categories, viewing product details, managing authentication pages, and using a cart interface. The project is still in development, with the current version focused on frontend pages, static catalog data, authentication endpoints, and the foundation for future backend models.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Available Routes](#available-routes)
- [API Endpoints](#api-endpoints)
- [Development Status](#development-status)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [License](#license)

## Overview

Nexra is organized as a multi-app Django project:

- `store` handles the main ecommerce pages and catalog API data.
- `accounts` handles login, signup, profile pages, and authentication API endpoints.
- `cart` handles the shopping cart page.
- `static` contains CSS, JavaScript, and image assets.
- `templates` contains the Django HTML templates.

The catalog is currently stored in Python data inside `store/views.py`. Database-backed product, cart, and account models are planned for later development.

## Features

- Ecommerce homepage.
- Category pages for food, tech, fashion, beauty, kids, and accessories.
- Product detail page template.
- Cart page.
- Login, signup, and profile pages.
- JSON endpoints for page catalog data.
- JSON endpoints for individual catalog items.
- Session-based login and signup API responses.
- Static assets for product images, banners, layout styling, and client-side interactions.

## Tech Stack

- Python
- Django
- SQLite for local development
- HTML templates
- CSS
- JavaScript

## Project Structure

```text
Nexra/
|-- accounts/              # Account pages and auth API views
|-- cart/                  # Cart page app
|-- core/                  # Django project settings and root URLs
|-- database_scripts/      # Database-related scripts and future utilities
|-- static/                # CSS, JavaScript, and images
|   |-- css/
|   |-- images/
|   `-- js/
|-- store/                 # Store pages and catalog API views
|-- templates/             # Django templates
|   |-- accounts/
|   |-- cart/
|   `-- store/
|-- .env                   # Local environment file, ignored by Git
|-- .gitignore
|-- db.sqlite3             # Local SQLite database, ignored by Git
`-- manage.py
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.10 or newer
- pip

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd Nexra
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

Install Django:

```bash
pip install django
```

This project does not yet include a `requirements.txt` file. When dependencies are finalized, generate one with:

```bash
pip freeze > requirements.txt
```

## Environment Variables

Create a local `.env` file for secrets and local configuration. The file is ignored by Git.

Recommended variables for future cleanup:

```env
SECRET_KEY=replace-with-a-secure-django-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
```

Current note: `core/settings.py` still contains development settings directly in the file. Before production deployment, move secrets and deployment-specific configuration into environment variables.

## Running the App

Apply migrations:

```bash
python manage.py migrate
```

Start the development server:

```bash
python manage.py runserver
```

Open the app in your browser:

```text
http://127.0.0.1:8000/
```

## Available Routes

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

### Account Pages

| Route | Description |
| --- | --- |
| `/accounts/login/` | Login page |
| `/accounts/signup/` | Signup page |
| `/accounts/profile/` | User profile page |

### Cart Page

| Route | Description |
| --- | --- |
| `/cart/` | Shopping cart page |

### Admin

| Route | Description |
| --- | --- |
| `/admin/` | Django admin |

## API Endpoints

### Page Catalog Data

```http
GET /api/pages/<slug>
```

Supported page slugs include:

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

### Catalog Item Data

```http
GET /api/catalog/items/<slug>
```

Catalog item slugs are generated from the page slug and item title.

Example format:

```text
tech-lg-smart-tv
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

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

Request body:

```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

## Development Status

This project is not finished yet. Current development focus areas include:

- Replacing static catalog data with database models.
- Adding product, category, cart, and order models.
- Improving authentication security.
- Moving secrets out of `core/settings.py`.
- Adding a dependency file such as `requirements.txt`.
- Adding automated tests.
- Preparing production settings.
- Improving admin management for products and orders.

## Security Notes

Before uploading or deploying:

- Do not commit `.env`.
- Do not commit `db.sqlite3`.
- Do not commit private keys, certificates, or local secrets.
- Replace the development `SECRET_KEY`.
- Set `DEBUG=False` in production.
- Restrict `ALLOWED_HOSTS` in production.
- Review CSRF exemptions on authentication API endpoints.

These files are already covered by `.gitignore`, but if any sensitive file was committed before the `.gitignore` was added, remove it from Git history before publishing the repository.

## Contributing

1. Create a new branch for your work.
2. Keep changes focused and easy to review.
3. Run the app locally before submitting changes.
4. Add tests when changing backend behavior.
5. Do not commit local databases, secrets, logs, or generated cache files.

## License

No license has been added yet. Add a `LICENSE` file before publishing if this project will be shared publicly.
