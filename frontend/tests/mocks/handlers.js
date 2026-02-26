import { http, HttpResponse } from 'msw'

const BASE = '/api'

export const mockUserData = {
    user_id: 1,
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    role_name: 'regular_user',
    role_level: 4,
    department_id: 1,
}

export const mockAdminData = {
    user_id: 2,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@example.com',
    role_name: 'super_admin',
    role_level: 1,
    department_id: 1,
}

export const handlers = [
    // Auth
    http.get(`${BASE}/user`, () =>
        HttpResponse.json({ data: mockUserData })
    ),
    http.post(`${BASE}/login`, () =>
        HttpResponse.json({
            data: {
                access_token: 'fake-jwt-token',
                user: mockUserData,
            },
        })
    ),
    http.post(`${BASE}/logout`, () =>
        HttpResponse.json({ data: { message: 'Logged out' } })
    ),
    http.post(`${BASE}/forget-password`, () =>
        HttpResponse.json({ data: { message: 'Reset link sent' } })
    ),
    http.post(`${BASE}/reset-password`, () =>
        HttpResponse.json({ data: { message: 'Password reset successfully' } })
    ),
    http.put(`${BASE}/update-password`, () =>
        HttpResponse.json({ data: { message: 'Password updated' } })
    ),

    // Claims
    http.get(`${BASE}/claims`, () =>
        HttpResponse.json({
            data: [
                { claim_id: 1, total_amount: 100, claim_status_id: 1 },
                { claim_id: 2, total_amount: 200, claim_status_id: 2 },
            ],
        })
    ),
    http.get(`${BASE}/my-claims`, () =>
        HttpResponse.json({
            data: [{ claim_id: 3, total_amount: 50, claim_status_id: 1 }],
        })
    ),
    http.post(`${BASE}/claims`, () =>
        HttpResponse.json({
            data: { claim_id: 4, total_amount: 150, claim_status_id: 1 },
        })
    ),

    // Lookups
    http.get(`${BASE}/lookups`, () =>
        HttpResponse.json({
            data: {
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
            },
        })
    ),

    // Users (admin)
    http.get(`${BASE}/admin/users`, () =>
        HttpResponse.json({
            data: [mockUserData, mockAdminData],
        })
    ),
    http.post(`${BASE}/admin/create-user`, () =>
        HttpResponse.json({
            data: {
                user: { user_id: 10, first_name: 'New', last_name: 'User' },
            },
        })
    ),
    http.put(`${BASE}/admin/users/:id`, ({ params }) =>
        HttpResponse.json({
            data: { user_id: Number(params.id), first_name: 'Updated' },
        })
    ),
    http.delete(`${BASE}/admin/users/:id`, () =>
        HttpResponse.json({ data: { message: 'Deleted' } })
    ),
]
