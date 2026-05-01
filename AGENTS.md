# Repository Guidelines

A web application for managing volunteering expenses and revenues, built with a Laravel backend and a React frontend, deployed on Google App Engine.

## Project Structure & Module Organization

The project is split into three main parts:
- **`backend/`**: Laravel (PHP) application serving the API.
- **`frontend/`**: React/Vite/Tailwind CSS application for the user interface.
- **`e2e/`**: Playwright test suite for end-to-end testing.

## Build, Test, and Development Commands

### Local Development (Non-Docker)
1.  **Backend**:
    ```bash
    cd backend && composer install && php artisan serve
    ```
2.  **Frontend**:
    ```bash
    cd frontend && pnpm install && pnpm dev
    ```

### Deployment (Google App Engine)
1.  **Frontend Build**: `cd frontend && pnpm build`
2.  **Deploy**: `./deploy-gae.sh` (Requires gcloud CLI authenticated)

### Lint and Test
- **Frontend Lint**: `cd frontend && pnpm lint`
- **Frontend Test**: `cd frontend && pnpm test`
- **Backend Test**: `cd backend && php artisan test`
- **E2E Test**: `npm run test:e2e`

## Coding Style & Naming Conventions

### Linting & Formatting
- **Frontend**: Uses ESLint (rules in `frontend/eslint.config.js`).
- **Backend**: PSR-12 conventions.

### Commit Guidelines
Follow **Conventional Commits** (e.g., `feat:`, `fix:`, `refactor:`, `test:`).
