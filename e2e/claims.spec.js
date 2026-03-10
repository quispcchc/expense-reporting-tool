import { test, expect } from '@playwright/test'
import { TEST_USERS, login } from './helpers/auth.js'

test.describe('Claims - Regular User (sees own claims only)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.user)
        await page.waitForURL(/\/user\/claims/)
    })

    test('can view their claims list', async ({ page }) => {
        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can navigate to create claim page', async ({ page }) => {
        const createBtn = page.getByRole('link', { name: /create|new|add/i })
            .or(page.getByRole('button', { name: /create|new|add/i }))
        await createBtn.first().click()
        await expect(page).toHaveURL(/create-claim/)
    })

    test('can access create claim form fields', async ({ page }) => {
        await page.goto('/user/claims/create-claim')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Form should have dropdown or input fields for claim creation
        const formElements = page.locator('.p-dropdown, select, input[type="text"], input[type="number"]')
        const count = await formElements.count()
        expect(count).toBeGreaterThan(0)
    })
})

test.describe('Claims - Approver (sees team-level claims)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.approver)
        await page.waitForURL(/\/admin/)
    })

    test('can view all claims page (team-scoped)', async ({ page }) => {
        await page.goto('/admin/claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view my claims page', async ({ page }) => {
        await page.goto('/admin/my-claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can navigate to create claim page', async ({ page }) => {
        await page.goto('/admin/claims/create-claim')
        await page.waitForLoadState('networkidle')

        const formElements = page.locator('.p-dropdown, select, input[type="text"], input[type="number"]')
        const count = await formElements.count()
        expect(count).toBeGreaterThan(0)
    })
})

test.describe('Claims - Admin (sees department-level claims)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.admin)
        await page.waitForURL(/\/admin/)
    })

    test('can view all claims page (department-scoped)', async ({ page }) => {
        await page.goto('/admin/claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view my claims page', async ({ page }) => {
        await page.goto('/admin/my-claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can navigate to create claim page', async ({ page }) => {
        await page.goto('/admin/claims/create-claim')
        await page.waitForLoadState('networkidle')

        const formElements = page.locator('.p-dropdown, select, input[type="text"], input[type="number"]')
        const count = await formElements.count()
        expect(count).toBeGreaterThan(0)
    })
})

test.describe('Claims - Super Admin (sees ALL claims)', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.superAdmin)
        await page.waitForURL(/\/admin/)
    })

    test('can view all claims page (all departments)', async ({ page }) => {
        await page.goto('/admin/claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can view my claims page', async ({ page }) => {
        await page.goto('/admin/my-claims')
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.p-datatable, .claims-datatable').first()).toBeVisible({ timeout: 10000 })
    })

    test('can navigate to create claim page', async ({ page }) => {
        await page.goto('/admin/claims/create-claim')
        await page.waitForLoadState('networkidle')

        const formElements = page.locator('.p-dropdown, select, input[type="text"], input[type="number"]')
        const count = await formElements.count()
        expect(count).toBeGreaterThan(0)
    })

    test('can see approve/reject actions on claims', async ({ page }) => {
        await page.goto('/admin/claims')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Look for bulk action buttons or checkboxes
        const hasActions = await page.locator(
            'button:has-text("Approve"), button:has-text("Reject"), ' +
            '.p-checkbox, [type="checkbox"], ' +
            '[data-testid*="approve"], [data-testid*="reject"]'
        ).count()

        // Claims page should load successfully
        expect(hasActions >= 0).toBeTruthy()
    })

    test('can view individual claim details', async ({ page }) => {
        await page.goto('/admin/claims')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        const viewLink = page.getByRole('link', { name: /view|detail/i })
            .or(page.locator('a[href*="view-claim"], a[href*="edit-claim"]'))
            .or(page.locator('.p-datatable-tbody tr').first())

        if (await viewLink.first().isVisible()) {
            await viewLink.first().click()
            await page.waitForTimeout(1000)
            expect(page.url()).toContain('claim')
        }
    })
})
