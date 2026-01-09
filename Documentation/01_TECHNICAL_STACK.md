# Volunteering Expense & Revenue Reporting Tool
## Technical Stack Documentation

---

## 1. Overview

This document provides a comprehensive overview of the technical stack used in the Volunteering Expense & Revenue Reporting Tool. The application is a full-stack web application designed to manage volunteer expense claims and revenue tracking with hierarchical approval workflows.

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18.x | UI library for building interactive components |
| **Build Tool** | Vite | Latest | Fast build and development server |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **UI Library** | PrimeReact | Latest | Pre-built React component library |
| **Routing** | React Router | 6.x | Client-side routing |
| **State Management** | React Context API | - | Global state management (User, Team, CostCentre) |
| **HTTP Client** | Axios | Latest | API communication with interceptors |
| **Form Validation** | Built-in React | - | Form handling and validation |
| **Development** | Node.js | 16+ | JavaScript runtime |
| **Package Manager** | npm | 8+ | Dependency management |

### 2.2 Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Laravel | 12.x | PHP web framework (MVC pattern) |
| **Language** | PHP | 8.2+ | Server-side scripting language |
| **Authentication** | Laravel Sanctum | Latest | API token-based authentication |
| **Database ORM** | Eloquent | - | Object-relational mapping |
| **API Architecture** | RESTful API | - | Resource-based API design |
| **Authorization** | Laravel Policies | - | Fine-grained access control |
| **Queue System** | Laravel Queue | - | Asynchronous job processing |
| **Notifications** | Laravel Notifications | - | Email and in-app notifications |
| **Validation** | Laravel Validation | - | Request data validation |
| **Dependency Manager** | Composer | 2.x | PHP package management |
| **Testing** | PHPUnit | Latest | Unit and feature testing |
| **Development Server** | Laravel Artisan | - | Built-in development server |

### 2.3 Database Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | SQLite | File-based relational database for development/small scale |
| **Alternative** | PostgreSQL/MySQL | Production-grade alternatives |
| **Location** | `backend/database/database.sqlite` | Local SQLite file |
| **Migrations** | Laravel Migrations | Version control for database schema |
| **Seeders** | Laravel Seeders | Sample data population |

### 2.4 DevOps & Deployment

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Application containerization |
| **Orchestration** | Docker Compose | Multi-container application management |
| **Web Server** | Apache/Nginx | HTTP server (in Docker) |
| **Frontend Hosting** | Static file serving (Vite build) | Production frontend deployment |
| **Backend Hosting** | Laravel application | RESTful API server |

### 2.5 Development Tools

| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **ESLint** | JavaScript code linting |
| **Laravel Pail** | Real-time log viewing |
| **Tinker** | Interactive PHP shell |
| **Postman** | API testing and documentation |
| **VS Code** | Code editor |

---

## 3. Architecture Pattern

### 3.1 Architecture Type
**N-Tier Architecture with Microservice Principles**

### 3.2 Layers

#### **Frontend Layer (React + Vite)**
- Single Page Application (SPA)
- Component-based UI structure
- Context API for state management
- Responsive design with Tailwind CSS

#### **API Layer (REST)**
- HTTP/HTTPS communication
- JSON data format
- Bearer token authentication
- Sanctum token-based API security

#### **Backend Layer (Laravel)**
- Service-oriented architecture
- Policy-based authorization
- Business logic implementation
- Eloquent ORM for data access

#### **Database Layer (SQLite/PostgreSQL)**
- Relational data model
- Custom primary keys (claim_id, user_id, team_id)
- Foreign key relationships
- Transactional support

---

## 4. Key Features by Technology

### 4.1 Authentication & Authorization

```
Frontend (React)
    ↓ (Login Credentials)
Backend (Laravel Sanctum)
    ↓ (API Token)
Frontend (Store in sessionStorage)
    ↓ (Bearer Token in Header)
Protected Routes
```

**Technology Stack:**
- **Frontend:** axios interceptor adds Bearer token from sessionStorage
- **Backend:** `auth:sanctum` middleware validates tokens
- **Storage:** sessionStorage for client-side token persistence

### 4.2 Data Flow Architecture

```
Client Request (React Component)
    ↓
Axios API Client (src/api/api.js)
    ↓ (with Bearer Token)
Laravel API Route (routes/api.php)
    ↓
Controller → Service Layer
    ↓
Eloquent ORM Query
    ↓
SQLite Database
    ↓ (Response JSON)
React Component (Re-render with new state)
```

### 4.3 Authorization Flow (Role-Based Access Control)

```
User Login
    ↓
Check role_level (1=Super Admin, 2=Admin, 3=Approver, 4=Regular)
    ↓
Route Protection by role:admin middleware
    ↓
Policy Check (ClaimPolicy)
    ↓
Grant/Deny Access
```

---

## 5. Database Schema Overview

### 5.1 Core Entities

| Entity | Primary Key | Purpose |
|--------|-------------|---------|
| **users** | user_id | System users (volunteers, approvers, admins) |
| **claims** | claim_id | Expense/revenue claims submitted by users |
| **expenses** | expense_id | Individual expenses within a claim |
| **mileage** | mileage_id | Mileage reimbursement records |
| **departments** | department_id | Organizational departments |
| **teams** | team_id | Teams within departments |
| **roles** | role_id | User roles and permissions |
| **cost_centres** | cost_centre_id | Cost allocation centers |
| **claim_approvals** | approval_id | Approval history and workflow |
| **claim_notes** | note_id | Comments and notes on claims |
| **receipts** | receipt_id | Receipt attachments |

### 5.2 Key Relationships

```
User (1) ──→ (M) Claims
User (1) ──→ (M) ClaimNotes
Claim (1) ──→ (M) Expenses
Claim (1) ──→ (M) Mileage
Claim (1) ──→ (M) ClaimApprovals
Department (1) ──→ (M) Teams
Team (1) ──→ (M) Users
```

---

## 6. API Endpoints Overview

### 6.1 Authentication Endpoints

```
POST   /api/login
POST   /api/logout
POST   /api/forget-password
POST   /api/reset-password
PUT    /api/update-password
GET    /api/user
```

### 6.2 Claim Management

```
GET    /api/claims                    (All claims - with role filtering)
POST   /api/claims                    (Create claim)
GET    /api/claims/{claimId}          (View claim)
PUT    /api/claims/{claimId}          (Edit claim)
DELETE /api/claims/{claimId}          (Delete claim)
GET    /api/my-claims                 (User's own claims)
POST   /api/claims/bulk-approve       (Admin approves multiple)
POST   /api/claims/bulk-reject        (Admin rejects multiple)
GET    /api/claims/{claimId}/export-pdf (Export to PDF)
```

### 6.3 Expense Management

```
GET    /api/expenses                  (All expenses)
POST   /api/expenses                  (Create expense)
GET    /api/expenses/{expenseId}      (View expense)
PUT    /api/expenses/{expenseId}      (Edit expense)
DELETE /api/expenses/{expenseId}      (Delete expense)
POST   /api/expenses/{expenseId}/approve (Approve expense)
POST   /api/expenses/{expenseId}/reject  (Reject expense)
```

### 6.4 Admin Management

```
GET    /api/admin/users               (List users)
POST   /api/admin/create-user         (Create user)
PUT    /api/admin/users/{id}          (Update user)
DELETE /api/admin/users/{id}          (Delete user)
GET    /api/roles                     (List roles)
POST   /api/roles                     (Create role)
```

### 6.5 Lookup Data

```
GET    /api/lookups                   (Active status, roles, departments, positions, claim types)
GET    /api/cost-centres              (Cost centres - CRUD)
POST   /api/notes                     (Create claim notes)
```

---

## 7. State Management Strategy

### 7.1 Frontend State Management (React Context)

```
App Component
├── UserContext
│   ├── users: Array
│   ├── currentUser: Object
│   ├── dispatch: Function
│   └── Actions: FETCH_USERS, SET_CURRENT_USER, etc.
├── TeamContext
│   ├── teams: Array
│   ├── dispatch: Function
│   └── Actions: FETCH_TEAMS, CREATE_TEAM, UPDATE_TEAM, DELETE_TEAM
└── CostCentreContext
    ├── costCentres: Array
    ├── dispatch: Function
    └── Actions: FETCH_COST_CENTRES, CREATE_COST_CENTRE, etc.
```

### 7.2 Backend State (Laravel Session/Database)

- No session state required (stateless API)
- All state managed via database transactions
- Multi-step operations wrapped in DB::transaction()

---

## 8. Security Architecture

### 8.1 Authentication

```
Credential Validation
    ↓
Token Generation (Sanctum)
    ↓
Token Storage (sessionStorage - Frontend)
    ↓
Bearer Token in HTTP Header
    ↓
Middleware Verification (auth:sanctum)
    ↓
Request Processing
```

### 8.2 Authorization (RBAC)

```
Route Middleware: role:{level}
    ↓
Policy Check: ClaimPolicy
    ↓
Business Logic Checks (no self-approve except Super Admin)
    ↓
Grant/Deny Operation
```

### 8.3 CORS Configuration

```
Frontend URL: http://localhost:5173
Backend URL: http://localhost:8000
CORS Allowed: Configured in backend/config/cors.php
Headers: Accept, Authorization, Content-Type
Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## 9. Development Workflow

### 9.1 Local Development Setup

**Backend:**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
composer dev  # Runs Artisan serve + queue + logs + Vite
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Starts Vite dev server at http://localhost:5173
```

### 9.2 Docker Development Setup

```bash
docker-compose up -d
docker-compose exec backend php artisan migrate
docker-compose logs -f backend
docker-compose down
```

### 9.3 Testing

**Backend:**
```bash
composer test
```

**Frontend:**
```bash
npm test
npm run test:ui
```

---

## 10. Performance Considerations

### 10.1 Query Optimization

- Eager loading relationships: `Claim::with([...])`
- Indexed primary keys: custom ID fields (claim_id, user_id)
- Pagination for large datasets

### 10.2 Frontend Optimization

- Code splitting via Vite
- Lazy loading components
- Context-based state prevents prop drilling
- Tailwind CSS purging for smaller bundle

### 10.3 Caching Strategy

- Database query caching (optional)
- Frontend state caching via Context API
- Browser caching for static assets

---

## 11. Monitoring & Logging

### 11.1 Backend Logging

```bash
# Real-time logs
php artisan pail

# Log files
storage/logs/laravel.log
```

### 11.2 Frontend Debugging

- Browser DevTools
- React DevTools Extension
- Network tab for API calls

---

## 12. Deployment Architecture

### 12.1 Production Stack

```
Frontend:
  - Build: npm run build (Vite)
  - Hosting: Static CDN / Web Server (Nginx/Apache)
  - Domain: https://reporting-tool.example.com

Backend:
  - Container: Docker image
  - Orchestration: Kubernetes / Docker Swarm
  - Database: PostgreSQL (production)
  - Caching: Redis (optional)

Storage:
  - Receipts: Cloud storage (AWS S3 / Azure Blob)
  - Database backups: Automated daily

Load Balancer:
  - Handles requests
  - SSL/TLS termination
  - Route to backend services
```

---

## 13. File Structure Organization

```
volunteering-expense-tool/
├── frontend/
│   ├── src/
│   │   ├── components/      (React components)
│   │   ├── contexts/        (Context API providers)
│   │   ├── pages/          (Page components)
│   │   ├── api/            (Axios configuration)
│   │   ├── utils/          (Utility functions)
│   │   └── router.jsx      (Route configuration)
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── Http/           (Controllers, Middleware)
│   │   ├── Models/         (Eloquent models)
│   │   ├── Services/       (Business logic)
│   │   ├── Policies/       (Authorization policies)
│   │   └── Notifications/  (Email/notification templates)
│   ├── routes/
│   │   └── api.php         (API routes definition)
│   ├── database/
│   │   ├── migrations/     (Schema migrations)
│   │   └── seeders/        (Sample data)
│   └── config/             (Configuration files)
└── Documentation/          (This documentation)
```

---

## 14. Key Patterns & Best Practices

### 14.1 Design Patterns

- **MVC Pattern:** Controllers handle HTTP, Models manage data, Views returned as JSON
- **Service Layer Pattern:** Business logic separated in Services
- **Repository Pattern:** Data access abstraction via Eloquent
- **Factory Pattern:** Model factories for testing
- **Observer Pattern:** Laravel events/notifications

### 14.2 Best Practices

- **Eager Loading:** Always use `::with()` to prevent N+1 queries
- **Transaction Safety:** Multi-step operations wrapped in DB::transaction()
- **Policy Authorization:** All data operations checked against policies
- **Role-Based Access:** Always validate role_level (lower = more privilege)
- **Validation:** Request validation on both frontend and backend

---

## 15. Dependencies & Versions

### 15.1 Critical Dependencies

**Frontend:**
- react@^18.0.0
- react-router-dom@^6.0.0
- axios@^1.0.0
- @primereact/core@latest
- tailwindcss@^4.0.0

**Backend:**
- laravel@^12.0
- laravel/sanctum@^4.0
- laravel/framework@^12.0
- php@^8.2

---

## 16. Future Scalability Considerations

1. **Microservices:** Break backend into independent services
2. **Message Queue:** Replace database queue with RabbitMQ/Redis
3. **Caching Layer:** Implement Redis for session/data caching
4. **GraphQL:** Consider GraphQL API alongside REST
5. **Mobile App:** React Native for iOS/Android
6. **Analytics:** Implement ELK stack for metrics
7. **Multi-tenant:** Support multiple organizations

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Maintained By:** Development Team
