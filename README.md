# Volunteering Expense & Revenue Reporting Tool

A web-based application for managing volunteering expenses and revenues, built with a Laravel backend and a React frontend, fully containerized with Docker.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Docker Desktop**: [Download & Install](https://www.docker.com/products/docker-desktop/)
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
    > [!NOTE]
    > The application now uses **PostgreSQL**. Ensure your `.env` file is configured with `DB_CONNECTION=pgsql` and matches the Docker service credentials.

### 🐘 Manual PostgreSQL Setup (Local Host)

If you prefer to run PostgreSQL directly on your local machine instead of using Docker, follow these steps:

1.  **Install PostgreSQL**
    - Download and install the version appropriate for your OS from the [official PostgreSQL download page](https://www.postgresql.org/download/).

2.  **Create Database**
    - Use `pgAdmin` or the terminal to create a database.
    - Ensure the database name matches the `DB_DATABASE` value in your `.env` file (default: `expense_db`).
    ```sql
    CREATE DATABASE expense_db;
    ```

3.  **Configure Environment**
    - Update your `.env` file with your local PostgreSQL credentials (`DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`, etc.).

4.  **Run Migrations**
    - Run the migrations from the backend directory:
    ```bash
    cd backend
    php artisan migrate
    ```

## 🚀 Running the Application

> [!IMPORTANT]
> **Recommended: Use Docker for Backend**
> For the best development experience and to avoid environment inconsistencies, it is **strongly recommended** to run the backend and database-related services using Docker. The manual setup instructions above are provided for users who specifically need to run PostgreSQL locally on their host machine.

This project supports multiple development and deployment configurations:

| Mode | Backend | Frontend | Use Case |
|------|---------|----------|----------|
| **Development (Recommended)** | Docker | Local (npm/pnpm) | Fast HMR, best DX |
| **Full Docker Development** | Docker | Docker | No local Node.js/PHP needed |
| **Production** | Docker + Nginx | Docker + Nginx | Deployment |

---

### Development Mode (Recommended)

Runs the backend in Docker while the frontend runs locally for faster development with HMR (Hot Module Replacement).

> [!TIP]
> This is the recommended setup for active development. Changes to frontend code reflect instantly without container rebuilds.

**Step 1: Start Backend Services**
```bash
# Start backend and queue worker in Docker
docker compose -f docker-compose.dev.yml up -d
```

**Step 2: Start Frontend Locally**
```bash
cd frontend

# Using npm
npm install    # First time only
npm run dev

# OR using pnpm (recommended for faster installs)
pnpm install   # First time only
pnpm dev
```

**Access Points:**
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

**Stop Development Environment:**
```bash
docker compose -f docker-compose.dev.yml down
# And Ctrl+C in the frontend terminal (or pnpm pm2:stop if using PM2)
```

---

### Full Docker Development (Alternative)

If you don't have Node.js or prefer a fully containerized environment, use this mode.

```bash
# Start all services in Docker (backend + frontend)
docker compose up -d

# View logs
docker compose logs -f
```

**Access Points:**
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

> [!NOTE]
> This mode is slower for frontend development as changes require container restarts. Use for testing or when local Node.js is unavailable.

---

### 🔄 PM2 Frontend Process Manager (Optional)

For convenience during development, you can use PM2 to run the frontend dev server as a background process. This eliminates the need to keep a terminal window open.

**Prerequisites:**

PM2 must be installed globally (recommended for Windows compatibility):
```bash
npm install -g pm2
```

**Available Commands:**
```bash
cd frontend

# Using npm
npm run pm2:start     # Start frontend as background daemon
npm run pm2:restart   # Restart after code changes
npm run pm2:status    # View process status
npm run pm2:logs      # Stream real-time logs
npm run pm2:stop      # Stop and remove the process

# OR using pnpm
pnpm pm2:start
pnpm pm2:restart
pnpm pm2:status
pnpm pm2:logs
pnpm pm2:stop
```

> [!NOTE]
> PM2 scripts auto-detect your package manager based on the lock file (`pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock`).

**Log Files:**
Logs are stored in `frontend/pm2-logs/`:
- `frontend-out.log` - Standard output
- `frontend-error.log` - Error output

> [!TIP]
> **Benefits of PM2:**
> - Runs frontend as a background daemon (no terminal window needed)
> - Auto-restarts if the process crashes
> - Centralized log management in `pm2-logs/` directory
> - Cross-platform support (Windows/Mac/Linux)

> [!IMPORTANT]
> **Important Notes:**
> - PM2 must be installed **globally** (`npm install -g pm2`) for Windows compatibility
> - PM2 is intended for **development convenience only**, not for production
> - For production builds, use Docker-based deployment with `docker-compose.prod.yml`
> - If you encounter issues, check logs in `frontend/pm2-logs/frontend-error.log`

> [!CAUTION]
> - Always run `npm run pm2:stop` or `pnpm pm2:stop` before closing your development session
> - Use `pm2 kill` to stop all PM2 processes if the scripts don't work
> - Running multiple PM2 instances can cause port conflicts on port 5173

---

### Production Mode

Production mode uses Nginx as a reverse proxy, serving both frontend and backend through a single entry point (port 80).

> [!TIP]
> For detailed deployment instructions including **Native Linux deployment without Docker**, see [deployment-guide.md](deployment-guide.md).

#### Docker Deployment (Recommended)

**Quick Deploy:**
```powershell
# Windows PowerShell
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

**Manual Deploy:**
```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

**Access Point:**
- **Application**: [http://deneb.ddns.net](http://deneb.ddns.net) (or your server IP on port 80)

**Architecture:**
```
User Browser → Nginx (:80) → {
    /     → Frontend (React static files)
    /api  → Backend (Laravel API)
}
```

**Stop Production Environment:**
```bash
docker compose -f docker-compose.prod.yml down
```

---

### Legacy Mode (Original docker-compose.yml)

For backward compatibility, the original `docker-compose.yml` is still available:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

## 🛑 Stopping the Application

To stop the containers and remove the networks:

```bash
docker compose down
```

To stop the containers but preserve the state:
```bash
Ctrl+C
# OR if running in detached mode
docker compose stop
```

## 📊 Viewing Logs

Monitoring logs is crucial for debugging and verifying that services are running correctly.

### View All Logs
To stream logs from all services (Backend, Frontend, and Queue):
```bash
docker compose logs -f
```

### View Backend Logs
To see only the Laravel backend logs:
```bash
docker compose logs -f backend
```

### View Frontend Logs
To see only the React frontend logs:
```bash
docker compose logs -f frontend
```

### View Queue Worker Logs
To see logs from the background queue worker:
```bash
docker compose logs -f queue
```

## 🔧 Troubleshooting & Debugging

### Common Issues

- **Database Errors**: If you encounter connection errors, ensure the PostgreSQL container is healthy.
    ```bash
    docker compose logs -f postgres
    ```

- **Migrations**: If tables are missing, run migrations manually:
    ```bash
    docker compose exec backend php artisan migrate
    ```

- **Permission Issues**: If you have permission issues with `storage` or `bootstrap/cache` on Linux/Mac:
    ```bash
    chmod -R 775 backend/storage backend/bootstrap/cache
    ```

- **Port Conflicts**: Ensure ports `8000` (Backend) and `5173` (Frontend) are not being used by other applications.

- **PostgreSQL Sequence Out of Sync**: If you encounter "duplicate key" errors after seeding data, reset all sequences:
    ```bash
    # For Production
    docker compose -f docker-compose.prod.yml exec postgres psql -U expense_user -d expense_db -c "
    DO \$\$
    DECLARE
        rec RECORD;
        seq_name TEXT;
        max_val BIGINT;
    BEGIN
        FOR rec IN 
            SELECT c.table_name, c.column_name
            FROM information_schema.columns c
            JOIN information_schema.tables t ON c.table_name = t.table_name
            WHERE c.column_default LIKE 'nextval%'
            AND t.table_schema = 'public'
        LOOP
            seq_name := pg_get_serial_sequence(rec.table_name, rec.column_name);
            IF seq_name IS NOT NULL THEN
                EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', rec.column_name, rec.table_name) INTO max_val;
                EXECUTE format('SELECT setval(%L, %s)', seq_name, max_val + 1);
            END IF;
        END LOOP;
    END \$\$;
    "

    # For Development (docker-compose.yml)
    docker compose exec postgres psql -U expense_user -d expense_db -c "
    DO \$\$
    DECLARE
        rec RECORD;
        seq_name TEXT;
        max_val BIGINT;
    BEGIN
        FOR rec IN 
            SELECT c.table_name, c.column_name
            FROM information_schema.columns c
            JOIN information_schema.tables t ON c.table_name = t.table_name
            WHERE c.column_default LIKE 'nextval%'
            AND t.table_schema = 'public'
        LOOP
            seq_name := pg_get_serial_sequence(rec.table_name, rec.column_name);
            IF seq_name IS NOT NULL THEN
                EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', rec.column_name, rec.table_name) INTO max_val;
                EXECUTE format('SELECT setval(%L, %s)', seq_name, max_val + 1);
            END IF;
        END LOOP;
    END \$\$;
    "
    ```

---

### 🐳 Useful Docker Commands

#### Container Management

```bash
# Start services in background (detached mode)
docker compose up -d --build

# Stop all containers
docker compose down

# Restart a specific service
docker compose restart backend
docker compose restart frontend
docker compose restart queue

# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Check container status and resource usage
docker stats
```

#### Log Viewing

```bash
# View all logs (follow mode)
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f queue

# View last N lines of logs
docker logs expense_backend --tail 100
docker logs expense_frontend --tail 100

# View Laravel application logs
docker exec expense_backend sh -c "cat storage/logs/laravel.log"

# View only recent Laravel logs (PowerShell)
docker exec expense_backend sh -c "cat storage/logs/laravel.log" 2>&1 | Select-Object -Last 50
```

#### Interactive Shell Access

```bash
# Access backend container shell
docker exec -it expense_backend sh

# Access frontend container shell
docker exec -it expense_frontend sh

# Run Laravel Artisan commands
docker compose exec backend php artisan migrate
docker compose exec backend php artisan migrate:fresh --seed
docker compose exec backend php artisan cache:clear
docker compose exec backend php artisan config:clear
docker compose exec backend php artisan route:list
```

#### Debugging & Maintenance

```bash
# Check container health
docker inspect expense_backend | grep -A 10 "State"

# View container environment variables
docker exec expense_backend env

# Clear Laravel caches
docker compose exec backend php artisan optimize:clear

# Rebuild containers without cache
docker compose build --no-cache

# Remove all stopped containers and unused images
docker system prune -a

# View Docker disk usage
docker system df
```

#### 🧹 Cleanup

For a complete cleanup of unused Docker resources (stopped containers, unused networks, images, and build cache), run:

```bash
docker system prune -a --volumes
```

#### Database Operations

> [!TIP]
> **Database Management**: The application uses **PostgreSQL**. Data is persisted in the `postgres_data` Docker volume.

```bash
# Run migrations (safe to run, will only run pending migrations)
docker compose exec backend php artisan migrate

# Run seeder (creates initial users and data)
docker compose exec backend php artisan db:seed

# Backup PostgreSQL database
docker exec expense_postgres pg_dump -U expense_user expense_db > backup.sql

# Restore PostgreSQL database
cat backup.sql | docker exec -i expense_postgres psql -U expense_user expense_db
```

#### 🌱 Production Seeder

For **initial production deployment**, use the `ProductionSeeder` to populate the database with production-ready seed data.

> [!IMPORTANT]
> The `ProductionSeeder` uses `firstOrCreate()` for all records, so it's safe to run multiple times without creating duplicates.

**Initial Production Setup:**
```bash
# For Docker production environment
docker compose -f docker-compose.prod.yml exec backend php artisan db:seed --class=ProductionSeeder

# For fresh database setup (WARNING: deletes all existing data!)
docker compose -f docker-compose.prod.yml stop queue
docker compose -f docker-compose.prod.yml exec backend php artisan migrate:fresh --seed --seeder=ProductionSeeder
docker compose -f docker-compose.prod.yml start queue
```

**Initial Login Credentials:**

| Email | Password | Role |
|-------|----------|------|
| `superadmin@carlingtonchc.org` | `password` | Super Admin |
| `admin@carlingtonchc.org` | `password` | Admin |

> [!WARNING]
> **Change these passwords immediately after first login!**

#### 🧪 Development/Test Seeder

For **local development and testing**, use the default `DatabaseSeeder` which creates random test data using factories.

**Development Setup:**
```bash
# For Docker development environment
docker compose -f docker-compose.dev.yml exec backend php artisan migrate:fresh --seed

# Or for full Docker environment
docker compose exec backend php artisan migrate:fresh --seed
```

**Test Login Credentials:**

| Email | Password | Role |
|-------|----------|------|
| `superadmin@example.com` | `password` | Super Admin |
| `admin@example.com` | `password` | Admin |
| `approver@example.com` | `password` | Approver |
| `test@example.com` | `password` | Regular User |

> [!NOTE]
> The `DatabaseSeeder` uses factories to generate random positions, teams, and other data. Each run produces different random data.

**Seeder Comparison:**

| Seeder | Use Case | Data |
|--------|----------|------|
| `DatabaseSeeder` | Development/Testing | Random test data via factories |
| `ProductionSeeder` | Production Deployment | Real organization data (Departments, Teams, Cost Centres, Projects, etc.) |

**SQL Alternative:**
If you prefer direct SQL import instead of Laravel seeder:
```bash
cat database/data_production.sql | docker exec -i expense_postgres psql -U expense_user expense_db
```

### 🐙 Useful Git Commands

#### 🧹 Clean Stale Branches

To remove local branches that have been deleted from the remote repository:

**PowerShell (Windows):**
```powershell
git fetch -p
git branch -vv | Select-String 'gone]' | ForEach-Object { $_.ToString().Trim().Split(' ')[0] } | ForEach-Object { git branch -D $_ }
```

**Bash (Mac/Linux):**
```bash
git fetch -p && git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
```
