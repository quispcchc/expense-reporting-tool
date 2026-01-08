# Copilot Instructions: Volunteering Expense & Revenue Reporting Tool

## Overview
- Full-stack app: Laravel 12 (PHP 8.2+) backend + React 18/Vite frontend.
- Domain: Volunteering expense claims with hierarchical approvals (department → team → user).
- Storage: SQLite file at backend/database/database.sqlite (custom primary keys like claim_id/user_id/team_id).

## Architecture & Domain
- RBAC by role_level (1 super admin, 2 admin, 3 approver, 4 regular); lower = more privilege.
- ClaimPolicy blocks self-approve/reject except super admin; scope rules per department/team in ClaimService::getAllClaims.
- Claim lifecycle: create → pending (status 1) → approve/reject via bulk endpoints in routes/api.php; claims have expenses (1:N) and optional mileage.
- Service layer pattern: controllers delegate to Services (e.g., ClaimService) for DB + transaction logic.

## Dev Workflows
- Local backend (from backend/): composer install → cp .env.example .env → php artisan key:generate → touch database/database.sqlite → php artisan migrate → composer dev (serve + queue + logs + vite). Backend at http://127.0.0.1:8000.
- Local frontend (from frontend/): npm install → npm run dev (Vite at http://127.0.0.1:5173).
- Docker (from repo root): docker-compose up -d; run migrations once: docker-compose exec backend php artisan migrate; logs: docker-compose logs -f backend; stop: docker-compose down. VITE_API_URL set to http://localhost:8000/api.
- Tests: backend composer test; frontend npm test or npm run test:ui.
- Useful artisan: route:list, pail (logs), tinker.

## Backend Patterns
- Auth: Laravel Sanctum; protected routes use auth:sanctum; tokens stored client-side in sessionStorage.
- Routing: apiResource for CRUD in routes/api.php; bulk approve/reject endpoints for claims.
- Data access: always eager load relationships (Claim::with([...])) and wrap multi-step writes in DB::transaction (e.g., ClaimService::createClaim).
- Policies: enforce role_level and no self-approval/rejection in app/Policies/ClaimPolicy.php.

## Frontend Patterns
- API layer: axios instance with interceptor adding Bearer token from sessionStorage in src/api/api.js.
- State: Context + reducer pattern (UserContext and dispatch separation) for entities like users/teams/cost centres.
- Routing: ProtectedRoute guards role-based access; admin routes under /admin, user routes under /user in src/router.jsx.
- UI stack: PrimeReact + Tailwind 4; mock data still used for approval UI, mileage form, CSV export.

## Key Files
- Backend endpoints: routes/api.php
- Domain logic: app/Services/ClaimService.php, app/Policies/ClaimPolicy.php, app/Models/Claim.php
- Frontend routing: src/router.jsx
- HTTP client: src/api/api.js

## Pitfalls
- Custom primary keys: avoid find($id) without specifying keys.
- Role checks must use role_level, not names.
- Email reset in dev requires manually visiting /reset-password (no mail host).
- CORS/frontend URL: expect http://localhost:5173 during dev; adjust .env if changed.
