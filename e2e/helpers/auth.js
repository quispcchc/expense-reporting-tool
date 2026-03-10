/**
 * Shared authentication helpers for E2E tests.
 *
 * Seeded test users (DatabaseSeeder):
 *   - superadmin@example.com / password  (Super Admin, role_level 1) → sees ALL claims, full sidebar
 *   - admin@example.com / password       (Admin, role_level 2)       → sees DEPARTMENT claims, full sidebar
 *   - approver@example.com / password    (Approver, role_level 3)    → sees TEAM claims, claims sidebar only
 *   - test@example.com / password        (Regular User, role_level 4)→ sees OWN claims only, user layout
 *
 * Sidebar visibility:
 *   - Super Admin & Admin: Claims section + General section (Users, Teams, Cost Centre, etc.)
 *   - Approver: Claims section only (All Claims, My Claims, New Claim)
 *   - Regular User: User layout (no admin sidebar)
 */

export const TEST_USERS = {
    superAdmin: {
        email: 'superadmin@example.com',
        password: 'password',
        redirectTo: '/admin',
        role: 'super_admin',
    },
    admin: {
        email: 'admin@example.com',
        password: 'password',
        redirectTo: '/admin',
        role: 'admin',
    },
    approver: {
        email: 'approver@example.com',
        password: 'password',
        redirectTo: '/admin',
        role: 'approver',
    },
    user: {
        email: 'test@example.com',
        password: 'password',
        redirectTo: '/user',
        role: 'regular_user',
    },
}

/**
 * Login via the UI login form.
 * Waits for redirect after successful login.
 */
export async function login(page, user) {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(user.email)
    await page.getByLabel(/password/i).fill(user.password)
    await page.getByRole('button', { name: /submit|login|sign in/i }).click()
    // Wait for navigation away from login
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 })
}

/**
 * Login and ensure we land on the expected path.
 */
export async function loginAndExpect(page, user) {
    await login(page, user)
    await page.waitForURL(`**${user.redirectTo}**`, { timeout: 10000 })
}

/**
 * Logout via the UI (clicks the user profile dropdown, then "Log out").
 */
export async function logout(page) {
    // Open the user profile dropdown — click the Avatar/user-info area
    const profileToggle = page.locator('.p-avatar').first()
    await profileToggle.click({ timeout: 5000 })

    // Click the "Log out" menu item in the dropdown
    const logoutItem = page.getByText(/log out/i)
    await logoutItem.first().click({ timeout: 5000 })
    await page.waitForURL('**/login**', { timeout: 10000 })
}
