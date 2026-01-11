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

3.  **Database Setup**
    Ensure the SQLite database file exists. The Docker setup expects this file to be present.
    ```bash
    # Linux/Mac
    touch backend/database/database.sqlite

    # Windows (PowerShell)
    New-Item -ItemType File -Path backend/database/database.sqlite -Force
    ```

## 🚀 Running the Application

Start the application using Docker Compose. This command builds the images and starts the containers.

```bash
docker-compose up --build
```

> **First Run Note**: The `docker-compose.yml` is configured to automatically handle migrations and initial setup.
> If you need to run migrations manually or seed the database:
> ```bash
> docker-compose exec backend php artisan migrate --seed
> ```

## 🌐 Accessing the Application

Once the services are up and running:

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

## 🛑 Stopping the Application

To stop the containers and remove the networks:

```bash
docker-compose down
```

To stop the containers but preserve the state:
```bash
Ctrl+C
# OR if running in detached mode
docker-compose stop
```

## 📊 Viewing Logs

Monitoring logs is crucial for debugging and verifying that services are running correctly.

### View All Logs
To stream logs from all services (Backend, Frontend, and Queue):
```bash
docker-compose logs -f
```

### View Backend Logs
To see only the Laravel backend logs:
```bash
docker-compose logs -f backend
```

### View Frontend Logs
To see only the React frontend logs:
```bash
docker-compose logs -f frontend
```

### View Queue Worker Logs
To see logs from the background queue worker:
```bash
docker-compose logs -f queue
```

## 🔧 Troubleshooting & Debugging

### Common Issues

- **Database Errors**: If you encounter errors related to the database (e.g., "no such table"), ensure `database.sqlite` exists and migrations have been run.
    ```bash
    docker-compose exec backend php artisan migrate
    ```

- **Permission Issues**: If you have permission issues with `storage` or `bootstrap/cache` on Linux/Mac:
    ```bash
    chmod -R 775 backend/storage backend/bootstrap/cache
    ```

- **Port Conflicts**: Ensure ports `8000` (Backend) and `5173` (Frontend) are not being used by other applications.

---

### 🐳 Useful Docker Commands

#### Container Management

```bash
# Start services in background (detached mode)
docker-compose up -d --build

# Stop all containers
docker-compose down

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart queue

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
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f queue

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
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan migrate:fresh --seed
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan route:list
```

#### Debugging & Maintenance

```bash
# Check container health
docker inspect expense_backend | grep -A 10 "State"

# View container environment variables
docker exec expense_backend env

# Clear Laravel caches
docker-compose exec backend php artisan optimize:clear

# Rebuild containers without cache
docker-compose build --no-cache

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

> [!CAUTION]
> **SQLite Database Locking**: The queue worker (`expense_queue`) maintains a persistent connection to the SQLite database. Running `migrate:fresh` or other destructive database commands while the queue worker is active will cause a **"database is locked"** error. Always stop the queue worker first.

```bash
# ⚠️ IMPORTANT: Stop queue worker before running migrate:fresh
docker-compose stop queue
docker-compose exec backend php artisan migrate:fresh --seed
docker-compose start queue

# Run specific seeder
docker-compose exec backend php artisan db:seed --class=UserSeeder

# Backup SQLite database
docker cp expense_backend:/var/www/html/database/database.sqlite ./backup.sqlite
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
