export const mockUsers = {
    regularUser: {
        user_id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        role_name: 'regular_user',
        role_level: 4,
        department_id: 1,
        position_id: 1,
    },
    superAdmin: {
        user_id: 2,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@example.com',
        role_name: 'super_admin',
        role_level: 1,
        department_id: 1,
        position_id: 1,
    },
    teamLead: {
        user_id: 3,
        first_name: 'Lead',
        last_name: 'User',
        email: 'lead@example.com',
        role_name: 'team_lead',
        role_level: 3,
        department_id: 1,
        position_id: 1,
    },
    deptManager: {
        user_id: 4,
        first_name: 'Dept',
        last_name: 'Manager',
        email: 'dept@example.com',
        role_name: 'department_manager',
        role_level: 2,
        department_id: 2,
        position_id: 1,
    },
}

export const mockClaims = [
    { claim_id: 1, total_amount: 100, claim_status_id: 1 },
    { claim_id: 2, total_amount: 200, claim_status_id: 2 },
]

export const mockLookups = {
    roles: [{ role_id: 1, role_name: 'super_admin' }],
    teams: [{ team_id: 1, team_name: 'Team A' }],
    departments: [{ department_id: 1, department_name: 'Engineering' }],
    positions: [{ position_id: 1, position_name: 'Volunteer' }],
    activeStatuses: [{ active_status_id: 1, active_status_name: 'active' }],
    costCentres: [{ cost_centre_id: 1, cost_centre_code: 1001 }],
    projects: [{ project_id: 1, project_name: 'Project A' }],
    accountNums: [{ account_number_id: 1, account_number: 5001 }],
    claimTypes: [{ claim_type_id: 1, claim_type_name: 'Expense' }],
    claimStatus: [{ claim_status_id: 1, claim_status_name: 'Pending' }],
    tags: [{ tag_id: 1, tag_name: 'Travel' }],
}
