# Volunteering Expense & Revenue Reporting Tool

A web-based application for managing volunteering expenses and revenues, built with a Laravel backend and a React frontend, optimized for Google App Engine deployment.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Google Cloud SDK (gcloud)**: [Download & Install](https://cloud.google.com/sdk/docs/install)
- **PHP 8.2+**: [Download & Install](https://www.php.net/downloads)
- **Composer**: [Download & Install](https://getcomposer.org/download/)
- **Node.js 20+ & pnpm**: [Download & Install](https://nodejs.org/)
- **Git**: [Download & Install](https://git-scm.com/downloads)

## 🛠️ Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd Volunteering_expense-and-revenue-reporting-tool
    ```

2.  **Environment Setup**
    Set up the backend environment variables.
    ```bash
    cp backend/.env.example backend/.env
    ```

3.  **Local Development Setup**
    ```bash
    # Backend setup
    cd backend
    composer install
    php artisan key:generate
    php artisan migrate

    # Frontend setup
    cd ../frontend
    pnpm install
    ```

## 🚀 Running the Application Locally

To run the application locally without Docker:

1.  **Start Backend**
    ```bash
    cd backend
    php artisan serve
    ```

2.  **Start Frontend**
    ```bash
    cd frontend
    pnpm dev
    ```

**Access Points:**
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

## 🌍 Deployment to Google App Engine

The application is pre-configured for Google App Engine Standard.

1.  **Build Frontend**
    ```bash
    cd frontend
    pnpm build
    ```

2.  **Deploy Services**
    ```bash
    # From the project root
    ./deploy-gae.sh
    ```
    *Note: Ensure you have authenticated with `gcloud auth login` and set your project with `gcloud config set project YOUR_PROJECT_ID`.*

### 🛣️ Deployment Architecture

```
User Browser → Google Cloud Load Balancer (App Engine) → {
    /     → default service (Frontend static files)
    /api  → api service (Laravel Backend)
}
```

## 🔧 Maintenance & Commands

### Database Operations

```bash
# Run migrations
cd backend
php artisan migrate

# Seed initial data
php artisan db:seed --class=ProductionSeeder
```

### Initial Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `superadmin@carlingtonchc.org` | `password` | Super Admin |
| `admin@carlingtonchc.org` | `password` | Admin |

> [!WARNING]
> **Change these passwords immediately after first login!**

## 🧪 Testing

### End-to-End (E2E) Tests
Powered by Playwright. Run from the project root:
```bash
pnpm install # (root)
npx playwright install
npm run test:e2e
```

### Frontend Unit Tests
```bash
cd frontend
pnpm test
```

### Backend Tests
```bash
cd backend
php artisan test
```
