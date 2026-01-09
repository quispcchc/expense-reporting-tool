# User Journey & Data Flow Documentation
## End-to-End Scenarios in the Volunteering Expense & Revenue Reporting Tool

---

## 1. User Scenario: Regular Volunteer Creating & Tracking a Claim

### 1.1 Complete User Journey - Claim Creation to Approval

#### **Phase 1: Login**

```
User Action:
1. User navigates to http://localhost:5173
2. Sees LoginPage component
3. Enters email & password
4. Clicks "Login" button

Frontend Process (React):
LoginPage.jsx
├── State: email, password, loading, errors
├── Form Validation: Check email format
├── On Submit: Call axios.post('/api/login')
└── Response Handler:
    ├── If Success: 
    │   ├── Store token in sessionStorage
    │   ├── Update UserContext with user data
    │   ├── Redirect to /user/my-claims
    └── If Error:
        └── Display error message

Backend Process (Laravel):
POST /api/login
├── No middleware required (public route)
├── LoginController@login
├── Request Validation:
│   ├── email: required|email|exists:users
│   └── password: required|string
├── Logic:
│   ├── Find user by email
│   ├── Verify password hash
│   ├── Generate Sanctum token
│   └── Return user + token
└── Response: {user: {...}, token: 'xxx...xxx'}

Database:
SELECT * FROM users WHERE email = ?
→ Hash verify password
→ INSERT personal_access_tokens record
```

**Data in Motion:**
```
Browser: POST http://localhost:8000/api/login
Headers: Content-Type: application/json
Body: {
  "email": "volunteer@example.com",
  "password": "password123"
}

Response:
{
  "user": {
    "user_id": 1,
    "name": "John Volunteer",
    "email": "volunteer@example.com",
    "role_level": 4,
    "department_id": 1,
    "team_id": 1
  },
  "token": "1|abc...xyz"
}
```

---

#### **Phase 2: Navigate to Create Claim**

```
User Action:
1. User is now at /user/my-claims dashboard
2. Clicks "Create New Claim" button

Frontend Process:
MyClaimPage.jsx (or UserCreateClaimPage.jsx)
├── Display existing claims (fetched on mount)
├── On button click: Navigate to /user/create-claim
└── CreateClaimPage loads with form

Form Initialization:
├── Fetch lookup data: GET /api/lookups
│   ├── Claim types
│   ├── Cost centres
│   ├── Departments
│   └── Teams
└── Display form with:
    ├── Claim Type dropdown (populated from lookups)
    ├── Date fields
    ├── Description field
    ├── Add Expense section
    ├── Add Mileage section
    └── Submit button

State Management (React Context):
UserContext.state = {
  currentUser: {user_id: 1, ...},
  lookupData: {
    claimTypes: [...],
    costCentres: [...]
  }
}
```

---

#### **Phase 3: Fill Claim Form & Add Expenses**

```
User Action:
1. Selects Claim Type: "Volunteer Expenses"
2. Enters Submission Date
3. Clicks "Add Expense"
4. Fills in expense details:
   - Description: "Volunteer uniforms"
   - Amount: £50.00
   - Cost Centre: "Ops001"
5. Uploads Receipt
6. Adds another expense (repeat)
7. Fills Mileage (optional):
   - Miles Traveled: 25
   - Mileage Rate: £0.45/mile
8. Adds Notes: "Uniform purchase for quarterly event"
9. Reviews Summary
10. Clicks "Submit Claim"

Frontend Validation:
CreateClaimPage.jsx
├── Form validation rules:
│   ├── claim_type: required
│   ├── submission_date: required, date
│   ├── expenses: min 1 expense required
│   ├── each expense:
│   │   ├── description: required, max 500
│   │   ├── amount: required, numeric, > 0
│   │   └── receipt: optional, allowed types (jpg, pdf)
│   └── mileage: numeric, >= 0
├── Real-time error display
└── Submit only if form valid

Form State:
{
  claim_type_id: 1,
  claim_submitted: "2026-01-08",
  expenses: [
    {
      description: "Volunteer uniforms",
      amount: 50.00,
      cost_centre_id: "CC001",
      receipt: File object
    },
    {
      description: "Travel reimbursement",
      amount: 25.00,
      cost_centre_id: "CC002",
      receipt: null
    }
  ],
  mileage: {
    miles_traveled: 25,
    rate_per_mile: 0.45
  },
  notes: "Uniform purchase for quarterly event",
  total_amount: 75.00
}
```

---

#### **Phase 4: Submit Claim (Frontend)**

```
User Action:
Click "Submit Claim" button

Frontend Process (React):
1. Final validation pass
2. Create FormData object (to handle file uploads)
3. Add claim data + expense files
4. axios.post('/api/claims', formData, {
     headers: {
       'Authorization': 'Bearer ' + sessionStorage.token,
       'Content-Type': 'multipart/form-data'
     }
   })
5. Show loading spinner
6. Handle response:
   ├── On success:
   │   ├── Show success toast notification
   │   ├── Update UserContext with new claim
   │   ├── Redirect to view claim page
   │   └── Display "Claim #123 created successfully"
   └── On error:
       ├── Show error toast
       ├── Display validation errors on form
       └── Allow user to fix and resubmit

Axios Interceptor (src/api/api.js):
Every request automatically includes:
- Authorization: Bearer {token}
- Accept: application/json
- CORS credentials handling
```

**Request Data Structure:**
```
FormData {
  claim_type_id: "1",
  claim_submitted: "2026-01-08",
  department_id: "1",
  team_id: "1",
  user_id: "1",
  status: "1" (pending),
  position_id: "1",
  expenses[0][description]: "Volunteer uniforms",
  expenses[0][amount]: "50.00",
  expenses[0][cost_centre_id]: "CC001",
  expenses[0][receipt]: File,
  expenses[1][description]: "Travel reimbursement",
  expenses[1][amount]: "25.00",
  expenses[1][cost_centre_id]: "CC002",
  expenses[1][receipt]: null,
  mileage[miles_traveled]: "25",
  mileage[rate_per_mile]: "0.45",
  notes: "Uniform purchase..."
}
```

---

#### **Phase 5: Submit Claim (Backend Processing)**

```
Backend Route:
POST /api/claims
├── Middleware: auth:sanctum → validates token
├── Middleware: role:* → allows all authenticated users
└── ClaimController@store

Controller Process (ClaimController):
1. Validate incoming request:
   $request->validate([
       'claim_type_id' => 'required|exists:claim_types',
       'expenses' => 'required|array|min:1',
       'expenses.*.amount' => 'required|numeric|min:0.01',
       'expenses.*.cost_centre_id' => 'required|exists:cost_centres'
   ])

2. Get authenticated user:
   $user = auth('sanctum')->user()

3. Call service layer:
   $claim = $this->claimService->createClaim($request->all(), $user)

Service Layer (ClaimService):
{
  START TRANSACTION
  
  1. Create Claim record:
     INSERT INTO claims (
       user_id, claim_type_id, department_id, team_id,
       claim_submitted, claim_status_id, total_amount
     )
     VALUES (1, 1, 1, 1, '2026-01-08', 1, 75.00)
     → Returns claim_id = 123
  
  2. Create Expenses:
     INSERT INTO expenses (
       claim_id, description, amount, cost_centre_id,
       expense_status_id
     )
     VALUES (123, 'Volunteer uniforms', 50.00, 'CC001', 1),
            (123, 'Travel reimbursement', 25.00, 'CC002', 1)
  
  3. Handle Receipt Files:
     FOR each receipt file:
       ├── Validate file type (jpg, png, pdf)
       ├── Validate file size (max 5MB)
       ├── Store in: storage/attachments/receipts/claim_123/
       ├── Generate filename: expense_456_20260108_volunteer-uniforms.jpg
       └── INSERT INTO receipts (
             expense_id, file_path, file_name, mime_type
           )
  
  4. Create Mileage (if provided):
     INSERT INTO mileage (
       claim_id, miles_traveled, rate_per_mile, total_amount
     )
     VALUES (123, 25, 0.45, 11.25)
  
  5. Queue Notification Job:
     Queue::dispatch(new ClaimCreatedNotification($claim))
     → Finds approvers
     → Sends email notifications
     → Logs notification attempt
  
  6. Return Claim with relationships:
     Claim::with([
       'expenses', 'mileage', 'claimType',
       'user', 'department', 'team'
     ])->find(123)
  
  COMMIT TRANSACTION
  
  IF ANY ERROR OCCURS:
    ROLLBACK TRANSACTION
    RETURN 422 Error Response
}

Database Operations:
┌─ CLAIMS Table
│  └─ INSERT claim_id=123, status_id=1
├─ EXPENSES Table
│  ├─ INSERT expense_id=456, amount=50.00
│  └─ INSERT expense_id=457, amount=25.00
├─ RECEIPTS Table
│  └─ INSERT receipt for expense_456
├─ MILEAGE Table
│  └─ INSERT mileage_id=789
└─ JOB_QUEUE Table
   └─ INSERT notification job
```

**Response Sent to Frontend:**
```json
{
  "claim_id": 123,
  "user_id": 1,
  "claim_type_id": 1,
  "claim_status_id": 1,
  "claim_submitted": "2026-01-08",
  "total_amount": 75.00,
  "created_at": "2026-01-08T10:30:00Z",
  "expenses": [
    {
      "expense_id": 456,
      "claim_id": 123,
      "description": "Volunteer uniforms",
      "amount": 50.00,
      "receipts": [
        {
          "receipt_id": 1001,
          "file_path": "storage/attachments/receipts/claim_123/expense_456_volunteer.jpg",
          "file_name": "expense_456_volunteer.jpg"
        }
      ]
    },
    {
      "expense_id": 457,
      "claim_id": 123,
      "description": "Travel reimbursement",
      "amount": 25.00
    }
  ],
  "mileage": {
    "mileage_id": 789,
    "claim_id": 123,
    "miles_traveled": 25,
    "rate_per_mile": 0.45,
    "total_amount": 11.25
  }
}
```

---

#### **Phase 6: View Claim Status (User)**

```
User Action:
1. Navigates to /user/my-claims
2. Views claim in list: "Claim #123 - Volunteer Expenses - PENDING"
3. Clicks on claim row
4. Navigates to /user/claims/123

Frontend Process:
ViewClaimPage.jsx
├── Load on mount: GET /api/claims/123
├── Headers: Authorization: Bearer {token}
├── Display:
│   ├── Claim header (ID, type, date, status)
│   ├── Expenses list with amounts
│   ├── Receipts as downloadable links
│   ├── Mileage breakdown
│   ├── Approval history
│   └── Notes section
└── Cannot edit (read-only for regular user)

Backend Process:
GET /api/claims/123
├── auth:sanctum middleware validates
├── ClaimController@show(123)
├── Policy check: User can view this claim?
│   ├── User is claim owner? → YES
│   └── Authorize
└── Query:
    Claim::with([
      'expenses.receipts',
      'mileage',
      'user',
      'department',
      'team',
      'claimType',
      'claimApprovals',
      'claimNotes'
    ])->findOrFail(123)

Database Query (Eloquent generates):
SELECT * FROM claims WHERE claim_id = 123;
SELECT * FROM expenses WHERE claim_id = 123;
SELECT * FROM receipts WHERE expense_id IN (456, 457);
SELECT * FROM mileage WHERE claim_id = 123;
SELECT * FROM claim_approvals WHERE claim_id = 123;
SELECT * FROM claim_notes WHERE claim_id = 123;
SELECT * FROM users WHERE user_id = 1;
... (and other relationships)

Database Response:
Complete claim object with all relationships loaded
```

---

## 2. User Scenario: Approver Reviewing & Approving Claims

### 2.1 Approver Dashboard

```
Approver (Role Level 3) Action:
1. Logs in with approver credentials
2. Navigates to /admin/all-claims
3. Sees list of pending claims assigned to their team

Frontend Process:
AllClaimsPage.jsx
├── Check user role (must be 3 or lower)
├── Fetch: GET /api/claims?filter=team_id&status=pending
├── Display in DataTable:
│   ├── Claim ID
│   ├── Submitter Name
│   ├── Claim Type
│   ├── Total Amount
│   ├── Submission Date
│   ├── Current Status
│   └── Action buttons (View, Approve, Reject)
├── Multi-select checkboxes
└── Bulk action buttons: "Approve Selected", "Reject Selected"

Backend Query:
GET /api/claims?filter=pending&team_id={approver_team_id}
├── auth:sanctum middleware
├── ClaimController@index
├── Request validation
├── Apply scope filtering:
    $query = Claim::with(...)
    ├── WHERE team_id = {approver_team_id}
    ├── WHERE claim_status_id = 1 (pending)
    └── ORDER BY created_at DESC
└── Paginate results (15 per page)

Database:
SELECT * FROM claims
WHERE team_id = 1 AND claim_status_id = 1
ORDER BY created_at DESC
LIMIT 15
```

---

### 2.2 Approve/Reject Workflow

```
Approver Action:
1. Selects multiple claims (checkboxes)
2. Clicks "Approve Selected" button
3. System shows confirmation dialog:
   "Approve 3 claims? This cannot be undone."
4. Confirms action

Frontend Process:
AllClaimsPage.jsx
├── Collect selected claim IDs: [123, 124, 125]
├── Show confirmation modal
├── On confirm:
│   └── POST /api/claims/bulk-approve
│       {
│         "claim_ids": [123, 124, 125]
│       }
├── Show loading indicator
├── On success:
│   ├── Show: "Successfully approved 3 claims"
│   ├── Refresh claim list
│   └── Update UI
└── On error:
    └── Show specific error messages

Backend Process:
POST /api/claims/bulk-approve
├── auth:sanctum middleware
├── ClaimController@bulkApproveClaim
├── Middleware: role:3,2,1 (approver level or higher)
├── Validate request:
    $request->validate([
      'claim_ids' => 'required|array|min:1',
      'claim_ids.*' => 'exists:claims,claim_id'
    ])
├── ClaimService@bulkApproveClaim
└── Service logic:
    {
      START TRANSACTION
      
      FOR each claim_id:
        1. Fetch claim: $claim = Claim::findOrFail($claim_id)
        2. Policy check: $this->authorize('approve', $claim)
           ├── Check: $user->id !== $claim->user_id
           ├── Check: $user->role_level <= 3
           ├── Check: $user->team_id matches claim team
           └── If check fails: throw AuthorizationException
        3. Update claim:
           $claim->update([
             'claim_status_id' => 2, // APPROVED
             'updated_at' => now()
           ])
        4. Create approval record:
           ClaimApproval::create([
             'claim_id' => $claim_id,
             'approver_id' => $approver_id,
             'approval_action' => 'approve',
             'approval_date' => now(),
             'notes' => null
           ])
        5. Dispatch notification:
           Notification::send(
             $claim->user,
             new ClaimApprovedNotification($claim)
           )
      
      COMMIT TRANSACTION
      
      RETURN {
        'success' => true,
        'approved_count' => 3,
        'message' => 'Claims approved successfully'
      }
    }

Database Changes:
UPDATE claims SET claim_status_id = 2 WHERE claim_id IN (123, 124, 125);
INSERT INTO claim_approvals (claim_id, approver_id, approval_action, approval_date)
VALUES (123, 5, 'approve', NOW()),
       (124, 5, 'approve', NOW()),
       (125, 5, 'approve', NOW());

Email Notifications Sent:
To: volunteer@example.com
Subject: Your Expense Claim #123 Has Been Approved
Body: Your claim for £75.00 submitted on 2026-01-08 has been approved.
```

---

## 3. User Scenario: Admin Managing Users & Cost Centres

### 3.1 User Management Flow

```
Admin (Role Level 1 or 2) Action:
1. Navigates to /admin/users
2. Clicks "Create New User"
3. Fills form:
   - Name: "Jane Smith"
   - Email: "jane.smith@example.com"
   - Department: "Operations"
   - Team: "Support Team"
   - Position: "Team Lead"
   - Role: "Approver" (Level 3)
4. Clicks "Create User"
5. System generates temporary password
6. Sends welcome email with password reset link

Frontend Process:
UsersPage.jsx → CreateUserModal
├── Form validation:
│   ├── name: required, string
│   ├── email: required, email, unique
│   ├── department_id: required
│   ├── team_id: required
│   ├── position_id: required
│   ├── role_level: required, in:1,2,3,4
│   └── phone: optional, phone format
├── POST /api/admin/create-user
└── On success:
    ├── Show success message
    ├── Refresh users table
    └── Clear form

Backend Process:
POST /api/admin/create-user
├── Middleware: auth:sanctum, role:1 (only super admin)
├── CreateUserController@createUser
├── Validation:
    'email' => 'required|email|unique:users',
    'department_id' => 'required|exists:departments',
    'team_id' => 'required|exists:teams'
├── Logic:
    {
      1. Generate temporary password
      2. Create user:
         User::create([
           'name' => 'Jane Smith',
           'email' => 'jane.smith@example.com',
           'password' => bcrypt($tempPassword),
           'department_id' => 1,
           'team_id' => 1,
           'position_id' => 2,
           'role_level' => 3,
           'active_status_id' => 1
         ])
      3. Send welcome email:
         Notification::send($user, new UserCreatedNotification($tempPassword))
      4. Log action for audit trail
    }
└── Return created user data

Email Sent:
To: jane.smith@example.com
Subject: Welcome to Expense Reporting System
Body:
  Your account has been created.
  Temporary password: xY9@pQz2
  Reset password link: https://example.com/reset-password?token=...
  Please change password on first login.
```

---

## 4. Database Transaction Safety Example

### 4.1 How Transactions Protect Data Integrity

```
Scenario: Approve claim with expenses

WITHOUT Transaction (PROBLEM):
├── Update claim status to APPROVED ✓
├── Try to create approval record...
├── ERROR: Database connection lost
└── RESULT: Claim marked approved but no approval record!

WITH Transaction (CORRECT):
├── START TRANSACTION
├── Update claim status to APPROVED ✓
├── Create approval record ✓
├── Queue notification job ✓
├── COMMIT
└── RESULT: All or nothing - data consistent!

Laravel Code:
DB::transaction(function () {
  $claim->update(['claim_status_id' => 2]);
  ClaimApproval::create([...]);
  Notification::dispatch(...);
});

If error occurs → Automatic ROLLBACK
All changes discarded, database unchanged
```

---

## 5. Role-Based Access Control (RBAC) Example

### 5.1 Authorization Check Flow

```
Request: POST /api/claims/bulk-approve

Scenario 1: Regular User (Role 4) tries to approve
├── auth:sanctum ✓ (has valid token)
├── role:3,2,1 ✗ (regular user has role 4)
└── RESULT: 403 Forbidden - "Unauthorized action"

Scenario 2: Approver (Role 3) tries to approve their own claim
├── auth:sanctum ✓ (has valid token)
├── role:3,2,1 ✓ (approver has role 3)
├── ClaimPolicy::approve() ✓ (checks)
│   ├── $user->id === $claim->user_id? NO ✓
│   └── Return true
└── RESULT: 200 OK - Claim approved

Scenario 3: Super Admin (Role 1) approves their own claim
├── auth:sanctum ✓ (has valid token)
├── role:3,2,1 ✓ (super admin has role 1)
├── ClaimPolicy::approve() ✓ (checks)
│   ├── if ($user->role_level === 1) return true;
│   └── Super admin bypass allowed
└── RESULT: 200 OK - Claim approved (exception allowed)
```

---

## 6. Error Handling in Complete Flow

### 6.1 File Upload Error Handling

```
User uploads receipt file

Frontend Validation:
├── File type: must be jpg, png, pdf
├── File size: max 5MB
└── If invalid:
    └── Show error: "File must be less than 5MB"

Backend Validation:
├── File validation:
    $request->validate([
      'expenses.*.receipt' => 'nullable|file|mimes:jpg,png,pdf|max:5120'
    ])
├── If validation fails:
    └── Return 422 Unprocessable Entity
       {
         "message": "The given data was invalid.",
         "errors": {
           "expenses.0.receipt": ["The receipt must be a file..."]
         }
       }
├── File storage:
    $path = $request->file('receipt')
           ->store('attachments/receipts/claim_' . $claim_id)
└── If storage fails:
    └── Return 500 Server Error
       {
         "message": "Failed to store receipt file"
       }
```

---

## 7. Complete API Response Examples

### 7.1 Successful Claim Creation

```json
{
  "data": {
    "claim_id": 123,
    "user_id": 1,
    "user": {
      "user_id": 1,
      "name": "John Volunteer",
      "email": "john@example.com"
    },
    "claim_type_id": 1,
    "claim_type": {
      "claim_type_id": 1,
      "name": "Volunteer Expenses"
    },
    "department_id": 1,
    "team_id": 1,
    "claim_submitted": "2026-01-08",
    "claim_status_id": 1,
    "total_amount": 75.00,
    "expenses": [
      {
        "expense_id": 456,
        "claim_id": 123,
        "description": "Volunteer uniforms",
        "amount": 50.00,
        "cost_centre_id": "CC001",
        "receipts": [
          {
            "receipt_id": 1001,
            "file_path": "attachments/receipts/claim_123/expense_456_uniform.jpg",
            "file_name": "expense_456_uniform.jpg",
            "mime_type": "image/jpeg"
          }
        ]
      }
    ],
    "mileage": {
      "mileage_id": 789,
      "claim_id": 123,
      "miles_traveled": 25,
      "rate_per_mile": 0.45,
      "total_amount": 11.25
    },
    "created_at": "2026-01-08T10:30:00Z",
    "updated_at": "2026-01-08T10:30:00Z"
  }
}
```

### 7.2 Error Response - Validation Failed

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "claim_type_id": ["The claim type id field is required."],
    "expenses.0.amount": ["The expenses.0.amount must be at least 0.01."],
    "expenses.0.cost_centre_id": ["The selected cost centre id is invalid."]
  }
}
```

### 7.3 Error Response - Authorization Failed

```json
{
  "message": "This action is unauthorized.",
  "code": "403"
}
```

---

## 8. Performance Metrics During Operations

### 8.1 Expected Response Times

```
GET /api/claims?page=1
├── Query time: ~50-100ms (with indexes)
├── JSON serialization: ~10-20ms
├── Network latency: ~20-50ms
└── Total time: ~100-150ms (acceptable)

POST /api/claims (with 2 expenses + 1 mileage + receipt)
├── File validation: ~5-10ms
├── File storage: ~50-100ms
├── Database insert: ~20-30ms
├── Notification queue: ~5-10ms
└── Total time: ~100-150ms (acceptable)

Database Index Strategy:
├── PRIMARY: claim_id, expense_id, etc.
├── Foreign Key: user_id, team_id, department_id
├── Filter: claim_status_id, created_at
└── Result: Fast queries even with thousands of claims
```

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Audience:** Client, Project Managers, QA Team
