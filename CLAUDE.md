# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CCHC Expense Claim Portal — a full-stack expense and revenue reporting tool. Laravel 12 REST API backend + React 18 SPA frontend, orchestrated with Docker Compose.

## Repository Structure

```
├── backend/          # Laravel 12 (PHP 8.2+, Sanctum auth)
├── frontend/         # React 18 + Vite + PrimeReact + Tailwind CSS
└── docker-compose.yml
```

## Common Commands

### Frontend (`cd frontend`)
```bash
npm run dev              # Dev server on :5173
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Vitest (all tests)
npx vitest run tests/path/to/file.test.jsx   # Single test
npx vitest --watch       # Watch mode
```

### Backend (`cd backend`)
```bash
php artisan serve        # Dev server on :8000
php artisan test         # All tests (local, requires expense_db_test)
php artisan test tests/Feature/SomeTest.php              # Single test file
php artisan test --filter=test_method_name               # Single test method
php artisan migrate      # Run migrations
php artisan migrate:fresh --seed   # Reset DB with seed data
php artisan route:list   # View all routes
```

### Backend Tests (Docker — required for CI)
Tests have a safety check requiring `DB_DATABASE=expense_db_test`. Run via:
```bash
docker exec -e DB_HOST=postgres -e DB_PORT=5432 -e DB_DATABASE=expense_db_test \
  expense_backend php artisan test
```

### Docker
```bash
docker-compose up -d                # Start all services
docker-compose down                 # Stop all services
```

## Architecture

### Backend
- **Auth**: Laravel Sanctum token auth. Token stored in frontend sessionStorage.
- **RBAC (4 levels)**: Super Admin (1) → Department Manager (2) → Team Lead (3) → User (4). Enforced via Policies (`app/Policies/`).
- **Service layer**: `ClaimService` and `ExpenseService` handle business logic. Controllers delegate to services.
- **Custom primary keys**: Models use descriptive PKs (`user_id`, `claim_id`, `expense_id`, etc.), not `id`. Always check the model's `$primaryKey`.
- **Enums**: `app/Enums/` — `RoleLevel`, `ClaimStatus`, `ClaimType`, `ActiveStatus`. Use these instead of magic numbers.
- **Ordering**: All index queries must use `->orderBy('primary_key')` to ensure consistent ordering.
- **CORS**: `ForceCorsHeaders` middleware validates origins against `FRONTEND_URL`/`ALT_FRONTEND_URL` env vars and `config/cors.php` allowed origins.
- **Database**: PostgreSQL in Docker (with PgBouncer pooling), SQLite for local dev.

### Frontend
- **State management**: React Context API. Providers in `src/contexts/`. `ClaimProvider` is keyed on `authUser.user_id` in `main.jsx` to reset state on login/logout.
- **UI components**: PrimeReact (DataTable, Dialog, Button, Toast, etc.) + Tailwind CSS for layout/utility styling.
- **API client**: `src/api/api.js` — Axios instance with interceptors for auth tokens and error handling.
- **Routing**: React Router in `src/router.jsx`. User routes under `/user/*`, admin routes under `/admin/*`.
- **i18n**: react-i18next. Translation keys use `namespace.key` format with English fallback strings inline.
- **Layout**: `AdminLayout` wraps admin routes with sidebar, header, and context providers. Content area uses `.page-container` class (max-width 1440px) to prevent stretching on large screens.

### Frontend Testing
- Vitest + React Testing Library + MSW for API mocking
- Setup in `tests/setup.js` — configures MSW server, mocks `js-cookie`, `window.matchMedia`
- MSW handlers in `tests/mocks/handlers.js`

### Backend Testing
- PHPUnit with `RefreshDatabase` trait for isolation
- `SeedsLookups` trait (`tests/Traits/SeedsLookups.php`) — seeds reference data (roles, departments, statuses) and provides helpers: `createUser()`, `createAuthenticatedUser()`, `createClaimForUser()`, `createClaimWithExpenses()`, `createClaimWithMileage()`
- Test DB safety: `TestCase.php` refuses to run if not targeting `expense_db_test`

## Key Conventions

- All query results must be ordered with explicit `orderBy()` on the primary key
- Frontend contexts that cache user-specific data must reset on auth change (use React `key` prop pattern)
- Wrap multi-step DB operations in `DB::transaction()`
- Use `::with()` for eager loading relationships to avoid N+1 queries
- PrimeReact components for data display (tables, forms); Tailwind for layout and custom styling
