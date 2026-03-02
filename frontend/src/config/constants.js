// Approval status IDs (used for claims/expenses)
export const APPROVAL_STATUS = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
}

// Active status IDs (used for departments, teams, cost centres, users)
export const ACTIVE_STATUS = {
    ACTIVE: 1,
    INACTIVE: 2,
}

// Role names (match backend role_name values)
export const ROLE_NAME = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    APPROVER: 'approver',
    USER: 'regular_user',
}

// Role levels (match backend role_level values)
export const ROLE_LEVEL = {
    SUPER_ADMIN: 1,
    DEPARTMENT_MANAGER: 2,
    TEAM_LEAD: 3,
    USER: 4,
}

// View modes (used for EditableExpansionTable, ClaimNotes, etc.)
export const VIEW_MODE = {
    CREATE: 'create',
    EDIT: 'edit',
    VIEW: 'view',
}

// User types for ClaimListDataTable
export const USER_TYPE = {
    ADMIN: 'admin',
    USER: 'user',
}

// Claim type IDs
export const CLAIM_TYPE = {
    REIMBURSEMENT: 1,
    PETTY_CASH: 2,
    CORPORATE_CARD: 3,
    NON_STAFF: 4,
    VENDOR_INVOICE: 5,
}
