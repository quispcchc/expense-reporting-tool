# Volunteering Expense & Revenue Reporting Tool - Backend

Laravel 12 (PHP 8.2+) backend for volunteering expense management system.

## Quick Start

### Local Development

```bash
# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Database setup
touch database/database.sqlite
php artisan migrate

# Run all services (server + queue + logs + vite)
composer dev
```

Backend runs at http://127.0.0.1:8000

### Docker Development

```bash
# From project root directory
docker-compose up -d

# Run migrations (first time only)
docker-compose exec backend php artisan migrate

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

Services:
- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- Queue Worker: Runs automatically

### Available Commands

```bash
# Run tests
composer test

# View routes
php artisan route:list

# Interactive shell
php artisan tinker

# Watch logs
php artisan pail
```

## Project Structure

```
app/
	├── Http/Controllers/    # Request handlers
	├── Models/              # Eloquent models (custom primary keys!)
	├── Policies/            # Authorization logic
	└── Services/            # Business logic layer
routes/api.php             # All API endpoints
database/
	├── migrations/          # Database schema
	└── seeders/             # Test data
```

## Key Conventions

- Primary Keys: Models use custom keys like claim_id, user_id (not id)
- Service Pattern: Controllers delegate to Services for business logic
- Eager Loading: Always use ::with() for relationships
- Transactions: Wrap multi-step operations in DB::transaction()

## Authentication

Uses Laravel Sanctum for API token authentication:
- Login endpoint: POST /api/login (returns token)
- Protected routes require Authorization: Bearer {token} header
- Token stored in frontend sessionStorage

## Role-Based Access Control

Based on role_level (lower = more privilege):
1. Super Admin (level 1): Full access
2. Admin (level 2): Department-level
3. Approver (level 3): Team-level
4. Regular User (level 4): Own claims only

See app/Policies/ClaimPolicy.php for authorization rules.

## License

The Laravel framework is open-sourced software licensed under the MIT license.
