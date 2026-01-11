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

## 🔧 Troubleshooting

- **Database Errors**: If you encounter errors related to the database (e.g., "no such table"), ensure `database.sqlite` exists and migrations have been run.
    ```bash
    docker-compose exec backend php artisan migrate
    ```

- **Permission Issues**: If you have permission issues with `storage` or `bootstrap/cache` on Linux/Mac:
    ```bash
    chmod -R 775 backend/storage backend/bootstrap/cache
    ```

- **Port Conflicts**: Ensure ports `8000` (Backend) and `5173` (Frontend) are not being used by other applications.