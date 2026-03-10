import { test, expect } from '@playwright/test'
import { TEST_USERS, login } from './helpers/auth.js'

// ═══════════════════════════════════════════════════════════════════
// Super Admin: full admin sidebar (Claims + General section)
// ═══════════════════════════════════════════════════════════════════

test.describe('Admin Resources - Super Admin (sees all)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.superAdmin)
        await page.waitForURL(/\/admin/)
    })

    test('sidebar shows General section with all management links', async ({ page }) => {
        // Super admin should see the General section
        const sidebar = page.locator('aside[role="navigation"], nav')

        // Should have Users, Teams/Departments, Cost Centre, Account Numbers, Tags, Settings, Dashboard
        await expect(sidebar.getByText(/users/i).first()).toBeVisible({ timeout: 5000 })
        await expect(sidebar.locator('a[href*="/admin/departments"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/cost-centre"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/settings"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/dashboard"]').first()).toBeVisible()
    })

    test('can view users list', async ({ page }) => {
        await page.goto('/admin/users')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can see add user button', async ({ page }) => {
        await page.goto('/admin/users')
        await page.waitForLoadState('networkidle')

        const addBtn = page.getByRole('button', { name: /add|create|new/i })
            .or(page.getByRole('link', { name: /add|create|new/i }))
        await expect(addBtn.first()).toBeVisible({ timeout: 10000 })
    })

    test('can view departments list', async ({ page }) => {
        await page.goto('/admin/departments')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can navigate to department teams', async ({ page }) => {
        await page.goto('/admin/departments')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const teamsLink = page.getByRole('link', { name: /teams|view teams/i })
            .or(page.locator('a[href*="/teams"]'))

        if (await teamsLink.first().isVisible()) {
            await teamsLink.first().click()
            await expect(page).toHaveURL(/departments\/.*\/teams/)
        }
    })

    test('can view cost centres list', async ({ page }) => {
        await page.goto('/admin/cost-centre')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view account numbers list', async ({ page }) => {
        await page.goto('/admin/account-numbers')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view tags list', async ({ page }) => {
        await page.goto('/admin/tags')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view settings page', async ({ page }) => {
        await page.goto('/admin/settings')
        await page.waitForLoadState('networkidle')

        await expect(
            page.getByText(/settings|mileage rate/i).first()
        ).toBeVisible({ timeout: 10000 })
    })

    test('can view dashboard', async ({ page }) => {
        await page.goto('/admin/dashboard')
        await page.waitForLoadState('networkidle')

        await expect(
            page.getByText(/dashboard|analytics|overview|total/i).first()
        ).toBeVisible({ timeout: 10000 })
    })
})

// ═══════════════════════════════════════════════════════════════════
// Admin: same sidebar as super admin (Claims + General section)
// but sees only their department's claims
// ═══════════════════════════════════════════════════════════════════

test.describe('Admin Resources - Admin (sees department)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.admin)
        await page.waitForURL(/\/admin/)
    })

    test('sidebar shows General section with management links', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')

        // Admin should also see the General section
        await expect(sidebar.getByText(/users/i).first()).toBeVisible({ timeout: 5000 })
        await expect(sidebar.locator('a[href*="/admin/departments"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/settings"]').first()).toBeVisible()
    })

    test('can view users page', async ({ page }) => {
        await page.goto('/admin/users')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view departments page', async ({ page }) => {
        await page.goto('/admin/departments')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view cost centres page', async ({ page }) => {
        await page.goto('/admin/cost-centre')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view settings page', async ({ page }) => {
        await page.goto('/admin/settings')
        await page.waitForLoadState('networkidle')

        await expect(
            page.getByText(/settings|mileage rate/i).first()
        ).toBeVisible({ timeout: 10000 })
    })

    test('can view dashboard', async ({ page }) => {
        await page.goto('/admin/dashboard')
        await page.waitForLoadState('networkidle')

        await expect(
            page.getByText(/dashboard|analytics|overview|total/i).first()
        ).toBeVisible({ timeout: 10000 })
    })
})

// ═══════════════════════════════════════════════════════════════════
// Approver: Claims section only — NO General section in sidebar
// Sees only their team's claims
// ═══════════════════════════════════════════════════════════════════

test.describe('Admin Resources - Approver (sees team only, no General section)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.approver)
        await page.waitForURL(/\/admin/)
    })

    test('sidebar shows Claims section but NOT General section', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')

        // Should see claims links
        await expect(sidebar.locator('a[href*="/admin/claims"]').first()).toBeVisible({ timeout: 5000 })
        await expect(sidebar.locator('a[href*="/admin/my-claims"]').first()).toBeVisible()

        // Should NOT see General section links
        await expect(sidebar.locator('a[href="/admin/users"]')).not.toBeVisible()
        await expect(sidebar.locator('a[href="/admin/departments"]')).not.toBeVisible()
        await expect(sidebar.locator('a[href="/admin/settings"]')).not.toBeVisible()
        await expect(sidebar.locator('a[href="/admin/dashboard"]')).not.toBeVisible()
    })

    test('can access claims pages', async ({ page }) => {
        await page.goto('/admin/claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can access my-claims page', async ({ page }) => {
        await page.goto('/admin/my-claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can access create claim page', async ({ page }) => {
        await page.goto('/admin/claims/create-claim')
        await page.waitForLoadState('networkidle')

        const formElements = page.locator('.p-dropdown, select, input[type="text"], input[type="number"]')
        const count = await formElements.count()
        expect(count).toBeGreaterThan(0)
    })
})

// ═══════════════════════════════════════════════════════════════════
// Regular User: NO admin sidebar at all — user layout only
// ═══════════════════════════════════════════════════════════════════

test.describe('Admin Resources - Regular User (no admin access)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.user)
        await page.waitForURL(/\/user/)
    })

    test('cannot access admin users page', async ({ page }) => {
        await page.goto('/admin/users')

        const url = page.url()
        const content = await page.textContent('body')
        const isBlocked = url.includes('/user') ||
            url.includes('/login') ||
            url.includes('/unauthorized') ||
            content.includes('Access Denied') ||
            content.includes('accessDenied') ||
            content.includes('noPermission')
        expect(isBlocked).toBeTruthy()
    })

    test('cannot access admin departments page', async ({ page }) => {
        await page.goto('/admin/departments')

        const url = page.url()
        const content = await page.textContent('body')
        const isBlocked = url.includes('/user') ||
            url.includes('/login') ||
            url.includes('/unauthorized') ||
            content.includes('Access Denied') ||
            content.includes('accessDenied') ||
            content.includes('noPermission')
        expect(isBlocked).toBeTruthy()
    })

    test('cannot access admin settings page', async ({ page }) => {
        await page.goto('/admin/settings')

        const url = page.url()
        const content = await page.textContent('body')
        const isBlocked = url.includes('/user') ||
            url.includes('/login') ||
            url.includes('/unauthorized') ||
            content.includes('Access Denied') ||
            content.includes('accessDenied') ||
            content.includes('noPermission')
        expect(isBlocked).toBeTruthy()
    })

    test('cannot access admin dashboard page', async ({ page }) => {
        await page.goto('/admin/dashboard')

        const url = page.url()
        const content = await page.textContent('body')
        const isBlocked = url.includes('/user') ||
            url.includes('/login') ||
            url.includes('/unauthorized') ||
            content.includes('Access Denied') ||
            content.includes('accessDenied') ||
            content.includes('noPermission')
        expect(isBlocked).toBeTruthy()
    })
})
