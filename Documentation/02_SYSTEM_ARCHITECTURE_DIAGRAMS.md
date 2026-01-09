# System Architecture & Layer Diagram Documentation
## Volunteering Expense & Revenue Reporting Tool

---

## 1. High-Level System Architecture

### 1.1 Three-Tier Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                      │
│              (React + Vite + PrimeReact)                │
│  • User Interface Components                            │
│  • Forms & Data Validation                              │
│  • Real-time Notifications                              │
│  • Context API State Management                         │
└────────────────────┬────────────────────────────────────┘
                     │ (HTTPS/Axios)
                     │ (Bearer Token Authentication)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                      │
│                  (Laravel API)                          │
│  • REST API Endpoints                                   │
│  • Request Validation                                   │
│  • Business Logic (Services)                            │
│  • Authorization & Policy Checks                        │
│  • Data Transformation                                  │
└────────────────────┬────────────────────────────────────┘
                     │ (SQL Queries via Eloquent ORM)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                             │
│                 (SQLite/PostgreSQL)                     │
│  • Claims & Expenses                                    │
│  • User Management                                      │
│  • Role & Permission Management                         │
│  • Audit Trail & Notifications                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Detailed System Architecture Diagram (Mermaid)

### 2.1 Complete System Flow

```mermaid
graph TB
    subgraph Client["CLIENT LAYER - Browser"]
        React["React SPA"]
        Components["UI Components"]
        Context["Context API State"]
        Router["React Router"]
        React --> Components
        React --> Context
        React --> Router
    end
    
    subgraph Network["NETWORK LAYER"]
        Axios["Axios HTTP Client"]
        Auth["Sanctum Auth Token"]
        Axios --> Auth
    end
    
    subgraph Backend["BACKEND LAYER - Laravel"]
        Routes["API Routes"]
        Middleware["Auth Middleware"]
        Controllers["Controllers"]
        Policies["Authorization Policies"]
        Services["Service Layer"]
        Models["Eloquent Models"]
        
        Routes --> Middleware
        Middleware --> Controllers
        Controllers --> Policies
        Controllers --> Services
        Services --> Models
    end
    
    subgraph Database["DATABASE LAYER"]
        SQLite["SQLite DB"]
        Cache["Query Cache"]
        SQLite --> Cache
    end
    
    subgraph External["EXTERNAL SERVICES"]
        Storage["File Storage - Receipts"]
        Email["Email Service"]
        Queue["Job Queue"]
    end
    
    Client -->|HTTP/JSON| Network
    Network -->|Authenticated Request| Backend
    Backend -->|SQL Queries| Database
    Backend -->|Upload/Download| Storage
    Backend -->|Send Notifications| Email
    Backend -->|Queue Jobs| Queue
```

---

## 3. Component Architecture Diagram

### 3.1 Frontend Component Hierarchy

```mermaid
graph TD
    App["App.jsx<br/>Main Component"]
    
    Auth["Auth Layer"]
    LoginPage["LoginPage"]
    ForgotPassword["ForgotPassword"]
    
    User["User Routes"]
    UserLayout["UserLayout"]
    MyClaimPage["MyClaimPage"]
    CreateClaimPage["CreateClaimPage"]
    ViewClaimPage["ViewClaimPage"]
    
    Admin["Admin Routes"]
    AdminLayout["AdminLayout"]
    AllClaimsPage["AllClaimsPage"]
    UsersPage["UsersPage"]
    TeamsPage["TeamsPage"]
    
    Contexts["State Management"]
    UserContext["UserContext"]
    TeamContext["TeamContext"]
    CostCentreContext["CostCentreContext"]
    
    App --> Auth
    Auth --> LoginPage
    Auth --> ForgotPassword
    
    App --> User
    User --> UserLayout
    UserLayout --> MyClaimPage
    UserLayout --> CreateClaimPage
    UserLayout --> ViewClaimPage
    
    App --> Admin
    Admin --> AdminLayout
    AdminLayout --> AllClaimsPage
    AdminLayout --> UsersPage
    AdminLayout --> TeamsPage
    
    App --> Contexts
    Contexts --> UserContext
    Contexts --> TeamContext
    Contexts --> CostCentreContext
```

---

## 4. Backend Service Layer Architecture

### 4.1 Service & Controller Flow

```mermaid
graph LR
    Request["HTTP Request"]
    Route["api.php Route"]
    Auth["Sanctum Auth"]
    Controller["Controller"]
    Policy["Authorization Policy"]
    Service["Service Class"]
    ORM["Eloquent ORM"]
    DB["Database"]
    
    Request --> Route
    Route --> Auth
    Auth --> Controller
    Controller --> Policy
    Policy --> Service
    Service --> ORM
    ORM --> DB
    
    DB -->|Data| ORM
    ORM -->|Models| Service
    Service -->|Processed Data| Controller
    Controller -->|JSON Response| Request
```

---

## 5. Data Flow: Creating a Claim

### 5.1 Complete User Journey - Claim Creation

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Frontend as React Frontend
    participant Axios as Axios Client
    participant Backend as Laravel Backend
    participant Policy as ClaimPolicy
    participant Service as ClaimService
    participant DB as SQLite Database
    participant Queue as Job Queue
    
    User->>Frontend: Click "Create Claim"
    Frontend->>Frontend: Display Form
    User->>Frontend: Fill Claim Details
    Frontend->>Frontend: Form Validation
    User->>Frontend: Submit Form
    
    Frontend->>Axios: POST /api/claims + Token
    Axios->>Backend: Send JSON Data
    Backend->>Backend: Validate Request
    Backend->>Policy: Check Authorization
    Policy->>Policy: Verify User Not Self-Approver
    Policy-->>Backend: Authorized
    
    Backend->>Service: createClaim($data)
    Service->>Service: Start Transaction
    Service->>DB: INSERT Claim Record
    Service->>DB: INSERT Expense Records
    Service->>DB: INSERT Mileage Record (if any)
    Service->>Service: Commit Transaction
    
    Service->>Queue: Queue Notification Job
    Queue->>Queue: Send Email to Approvers
    
    Service-->>Backend: Return Claim Object
    Backend-->>Axios: JSON Response {claim_id, status, ...}
    Axios-->>Frontend: Success Response
    Frontend->>Frontend: Update Context State
    Frontend->>Frontend: Redirect to View Claim
    Frontend-->>User: Display Success Message
```

---

## 6. Data Flow: Approving a Claim

### 6.1 Claim Approval Workflow

```mermaid
sequenceDiagram
    participant Approver as Approver
    participant Frontend as React
    participant Backend as Laravel
    participant Policy as ClaimPolicy
    participant Service as ClaimService
    participant DB as Database
    participant Notify as Notification
    
    Approver->>Frontend: View All Claims
    Frontend->>Frontend: Display Paginated List
    Approver->>Frontend: Select Claims & Click Approve
    
    Frontend->>Backend: POST /api/claims/bulk-approve
    Backend->>Policy: Check Approver Role (Level 3 or lower)
    Policy-->>Backend: Authorized
    
    Backend->>Service: bulkApproveClaim($claimIds)
    Service->>Service: Start Transaction
    
    loop For Each Claim
        Service->>Policy: Verify Not Self-Approve
        Service->>DB: UPDATE claim_status = APPROVED
        Service->>DB: INSERT ClaimApproval Record
        Service->>Notify: Queue Notification
    end
    
    Service->>Service: Commit Transaction
    Service-->>Backend: Success
    Backend-->>Frontend: {approved_count, success}
    Frontend->>Frontend: Update UI
    Frontend-->>Approver: Show Success Toast
```

---

## 7. Database Schema Diagram

### 7.1 Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ CLAIMS : submits
    USERS ||--o{ CLAIM_NOTES : writes
    USERS ||--o{ CLAIM_APPROVALS : approves
    
    CLAIMS ||--o{ EXPENSES : contains
    CLAIMS ||--o{ MILEAGE : contains
    CLAIMS ||--o{ CLAIM_NOTES : "has notes"
    CLAIMS ||--o{ CLAIM_APPROVALS : "has approvals"
    CLAIMS ||--o{ RECEIPTS : "has receipts"
    
    DEPARTMENTS ||--o{ TEAMS : contains
    DEPARTMENTS ||--o{ USERS : employs
    DEPARTMENTS ||--o{ CLAIMS : receives
    
    TEAMS ||--o{ USERS : contains
    TEAMS ||--o{ CLAIMS : receives
    
    COST_CENTRES ||--o{ EXPENSES : allocates
    
    ROLES ||--o{ USERS : assign
    POSITIONS ||--o{ USERS : assign
    
    CLAIM_TYPES ||--o{ CLAIMS : categorizes
    CLAIM_STATUS ||--o{ CLAIMS : defines
    ACTIVE_STATUS ||--o{ USERS : defines
```

---

## 8. Authentication & Authorization Flow

### 8.1 Login Process

```mermaid
graph TD
    A["User Enters Credentials"]
    B["Frontend: POST /api/login"]
    C["Backend: Validate Email"]
    D["Backend: Hash Password Check"]
    E["Backend: Password Correct?"]
    F["Backend: Generate Sanctum Token"]
    G["Return Token + User Data"]
    H["Frontend: Store Token in sessionStorage"]
    I["Frontend: Set Axios Default Header"]
    J["Frontend: Redirect to Dashboard"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E -->|Yes| F
    E -->|No| K["Return 401 Unauthorized"]
    F --> G
    G --> H
    H --> I
    I --> J
```

### 8.2 Authorization Levels (Role-Based Access Control)

```
Role Level 1 (Super Admin)
├── Can manage all users
├── Can manage all claims
├── Can bypass approval workflow
└── Can access all admin functions

Role Level 2 (Admin)
├── Can manage users in their department
├── Can view all claims in department
├── Can approve/reject claims
└── Can manage teams

Role Level 3 (Approver)
├── Can view claims in their team
├── Can approve/reject assigned claims
└── Can add notes to claims

Role Level 4 (Regular User)
├── Can submit claims
├── Can view own claims
├── Can track claim status
└── Can download receipts
```

---

## 9. API Communication Flow

### 9.1 Request/Response Cycle

```mermaid
sequenceDiagram
    participant Frontend
    participant Axios
    participant Laravel as Laravel API
    participant Controller
    participant Service
    participant Model
    participant DB
    
    Frontend->>Axios: api.get('/claims')
    Note over Axios: Add Bearer Token from<br/>sessionStorage
    Axios->>Laravel: GET /api/claims<br/>Headers: Authorization: Bearer TOKEN
    
    Laravel->>Controller: Route resolved
    Controller->>Service: getClaimsWithFilters($user)
    Service->>Model: Claim::with(['user', 'team'])<br/>.where(...)->get()
    
    Model->>DB: SELECT * FROM claims...
    DB-->>Model: Result set
    Model-->>Service: Collection of Models
    Service->>Service: Apply scope filtering
    Service-->>Controller: Processed data
    
    Controller->>Controller: Transform to JSON
    Controller-->>Laravel: Response
    Laravel-->>Axios: {status: 200, data: {...}}
    Axios->>Frontend: Handle success callback
    Frontend->>Frontend: Update Context state
    Frontend->>Frontend: Re-render components
```

---

## 10. File Storage Architecture

### 10.1 Receipt Upload & Storage

```mermaid
graph LR
    A["Receipt File<br/>Selected by User"]
    B["Frontend Validation<br/>(Type, Size)"]
    C["FormData Creation"]
    D["POST /api/expenses<br/>with File"]
    E["Backend File Validation"]
    F["Store in<br/>storage/attachments/receipts/"]
    G["Record in<br/>RECEIPTS Table"]
    H["Return File Reference"]
    I["Frontend Display<br/>Thumbnail"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
```

---

## 11. Notification Architecture

### 11.1 Notification Flow

```mermaid
graph TD
    A["Claim Created/Updated"]
    B["Event Triggered"]
    C["Queue Job"]
    D["Find Approvers"]
    E["Generate Email"]
    F["Send Email"]
    G["Log Notification"]
    H["Update Claim Status"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    
    I["Approver Receives<br/>Email Notification"]
    F --> I
```

---

## 12. Error Handling & Validation Architecture

### 12.1 Validation Flow

```mermaid
graph TD
    A["User Input"]
    B["Frontend Validation<br/>React Forms"]
    C["Valid?"]
    D["Submit to Backend"]
    E["Backend Request Validation<br/>Laravel Rules"]
    F["Valid?"]
    G["Process Request"]
    H["Database Constraints"]
    I["Success Response"]
    
    A --> B
    B --> C
    C -->|No| J["Display Error"]
    C -->|Yes| D
    D --> E
    E --> F
    F -->|No| K["Return 422<br/>Validation Errors"]
    F -->|Yes| G
    G --> H
    H -->|Constraint Violation| L["Return 400 Error"]
    H -->|Success| I
    
    J --> A
    K --> B
    L --> A
```

---

## 13. Scalability & Performance Architecture

### 13.1 Caching Strategy

```mermaid
graph LR
    A["Client Request"]
    B["Check Browser Cache"]
    C["Cache Hit?"]
    D["Return Cached Data"]
    E["API Request"]
    F["Check Server Cache"]
    G["Cache Hit?"]
    H["DB Query"]
    I["Store in Cache"]
    J["Return Response"]
    
    A --> B
    B --> C
    C -->|Yes| D
    C -->|No| E
    E --> F
    F --> G
    G -->|Yes| J
    G -->|No| H
    H --> I
    I --> J
```

---

## 14. Deployment Architecture

### 14.1 Production Deployment Stack

```mermaid
graph TB
    Users["End Users"]
    CDN["CDN / Static Files<br/>React Build"]
    LB["Load Balancer<br/>SSL/TLS"]
    
    subgraph Kubernetes["Kubernetes Cluster"]
        FrontendPod["Frontend Pods<br/>Nginx + React"]
        BackendPod1["Backend Pod 1<br/>Laravel"]
        BackendPod2["Backend Pod 2<br/>Laravel"]
        BackendPod3["Backend Pod 3<br/>Laravel"]
        Worker["Worker Pods<br/>Queue Jobs"]
    end
    
    DB["PostgreSQL<br/>Database"]
    Redis["Redis Cache"]
    Storage["Cloud Storage<br/>S3/Azure"]
    
    Users --> CDN
    CDN --> LB
    LB --> FrontendPod
    LB --> BackendPod1
    LB --> BackendPod2
    LB --> BackendPod3
    
    BackendPod1 --> DB
    BackendPod2 --> DB
    BackendPod3 --> DB
    BackendPod1 --> Redis
    BackendPod2 --> Redis
    BackendPod3 --> Redis
    BackendPod1 --> Storage
    Worker --> DB
    Worker --> Storage
```

---

## 15. How to Generate These Diagrams

### 15.1 Using Mermaid (Recommended - Free & Easy)

**Option 1: GitHub Integration**
1. Copy Mermaid code blocks (marked with triple backticks and 'mermaid')
2. Paste into GitHub README or Issues - auto-renders!
3. No additional tools needed

**Option 2: Mermaid Live Editor**
1. Visit: https://mermaid.live
2. Paste the mermaid code
3. Click "Export" → Choose format (PNG, SVG, PDF)
4. Download and insert into PowerPoint

**Option 3: Mermaid VS Code Extension**
1. Install "Markdown Preview Mermaid Support" extension
2. Open any .md file with mermaid code
3. Preview renders live in editor
4. Take screenshots or export

### 15.2 Using PlantUML (Alternative)

1. Visit: https://www.plantuml.com/plantuml/uml/
2. Paste PlantUML syntax (can convert from Mermaid)
3. Generate PNG/SVG/PDF
4. Download and use

### 15.3 Using Draw.io (Manual but Powerful)

1. Visit: https://draw.io
2. Create new diagram
3. Manually draw boxes and connectors
4. Add labels and colors
5. Export as PNG/SVG/PDF
6. Insert into PowerPoint

### 15.4 Converting to PowerPoint

**Method 1: Direct Insertion**
1. Generate PNG/SVG from diagram tool
2. Open PowerPoint
3. Insert → Picture → Select your diagram
4. Resize and position on slide

**Method 2: Using Online Converter**
1. Export diagram as SVG
2. Upload to: https://cloudconvert.com (SVG to EMF)
3. This creates editable PowerPoint-ready format
4. Insert → Picture → EMF file

**Method 3: Copy-Paste from Web**
1. Generate diagram in Mermaid Live or similar
2. Right-click → Copy Image
3. Paste directly into PowerPoint slide

---

## 16. Recommended Diagram Creation Workflow for Presentations

### 16.1 For Quick Presentations

```
1. Use Mermaid Live Editor
   └─→ Copy code from this document
   └─→ Paste into editor
   └─→ Export as PNG
   └─→ Insert into PowerPoint

2. Total time: 5-10 minutes per diagram
```

### 16.2 For Professional Presentations

```
1. Use Draw.io or Lucidchart
   └─→ Recreate diagrams manually (more control)
   └─→ Add company branding/colors
   └─→ Export as high-resolution PNG
   └─→ Insert into PowerPoint template

2. Total time: 30-45 minutes per diagram (more polished)
```

### 16.3 For Interactive Presentations

```
1. Embed Mermaid diagrams in HTML
2. Use reveal.js or similar for presentation
3. Diagrams render live during presentation
4. Can dynamically explain flow
```

---

## 17. PowerPoint Slide Suggestions

### Slide 1: Title & Overview
```
Title: Volunteering Expense & Revenue Reporting Tool
Subtitle: System Architecture & Technical Overview
Image: System architecture diagram
```

### Slide 2: Technology Stack
```
- Frontend: React 18, Vite, Tailwind CSS, PrimeReact
- Backend: Laravel 12, PHP 8.2, Eloquent ORM
- Database: SQLite (dev), PostgreSQL (prod)
- Auth: Laravel Sanctum
- DevOps: Docker & Docker Compose
```

### Slide 3: Three-Tier Architecture
```
Diagram showing:
- Presentation Layer (React)
- Application Layer (Laravel API)
- Data Layer (Database)
```

### Slide 4: Component Hierarchy
```
Frontend component diagram
```

### Slide 5: Data Flow - Create Claim
```
Sequence diagram showing full claim creation flow
```

### Slide 6: Data Flow - Approve Claim
```
Sequence diagram showing approval workflow
```

### Slide 7: Authentication & RBAC
```
Auth flow diagram + role hierarchy
```

### Slide 8: API Architecture
```
REST API endpoints with HTTP methods
```

### Slide 9: Database Schema
```
Entity relationship diagram
```

### Slide 10: Deployment
```
Production deployment architecture (Kubernetes)
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Diagrams Format:** Mermaid  
**Ready for:** PowerPoint Presentation
