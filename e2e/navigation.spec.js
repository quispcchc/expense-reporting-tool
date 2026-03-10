import { test, expect } from '@playwright/test'
import { TEST_USERS, login } from './helpers/auth.js'

// ═══════════════════════════════════════════════════════════════════
// Regular User Navigation (UserLayout — no admin sidebar)
// ═══════════════════════════════════════════════════════════════════

test.describe('Navigation - Regular User', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.user)
        await page.waitForURL(/\/user/)
    })

    test('lands on claims page after login', async ({ page }) => {
        await expect(page).toHaveURL(/\/user\/claims/)
    })

    test('can navigate to create claim', async ({ page }) => {
        const createBtn = page.getByRole('link', { name: /create|new|add/i })
            .or(page.getByRole('button', { name: /create|new|add/i }))

        if (await createBtn.first().isVisible()) {
            await createBtn.first().click()
            await expect(page).toHaveURL(/create-claim/)
        }
    })
})

// ═══════════════════════════════════════════════════════════════════
// Approver Navigation (AdminLayout — Claims section only)
// ═══════════════════════════════════════════════════════════════════

test.describe('Navigation - Approver', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.approver)
        await page.waitForURL(/\/admin/)
    })

    test('sidebar has claims links only', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')

        // Claims section links visible
        await expect(sidebar.locator('a[href*="/admin/claims"]').first()).toBeVisible({ timeout: 5000 })
        await expect(sidebar.locator('a[href*="/admin/my-claims"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="create-claim"]').first()).toBeVisible()

        // General section NOT visible
        await expect(sidebar.locator('a[href="/admin/users"]')).not.toBeVisible()
        await expect(sidebar.locator('a[href="/admin/departments"]')).not.toBeVisible()
    })

    test('can navigate between claims pages via sidebar', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')

        // Go to my claims
        await sidebar.locator('a[href*="/admin/my-claims"]').first().click()
        await expect(page).toHaveURL(/\/admin\/my-claims/)

        // Go to all claims
        await sidebar.locator('a[href="/admin/claims"]').first().click()
        await expect(page).toHaveURL(/\/admin\/claims/)
    })
})

// ═══════════════════════════════════════════════════════════════════
// Admin Navigation (AdminLayout — Claims + General section)
// ═══════════════════════════════════════════════════════════════════

test.describe('Navigation - Admin', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.admin)
        await page.waitForURL(/\/admin/)
    })

    test('sidebar has Claims section and General section', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')

        // Claims section
        await expect(sidebar.locator('a[href*="/admin/claims"]').first()).toBeVisible({ timeout: 5000 })

        // General section
        await expect(sidebar.locator('a[href*="/admin/users"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/departments"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/cost-centre"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/settings"]').first()).toBeVisible()
    })

    test('can navigate to users page via sidebar', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')
        await sidebar.locator('a[href*="/admin/users"]').first().click()
        await expect(page).toHaveURL(/\/admin\/users/)
    })

    test('can navigate to departments page via sidebar', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')
        await sidebar.locator('a[href*="/admin/departments"]').first().click()
        await expect(page).toHaveURL(/\/admin\/departments/)
    })
})

// ═══════════════════════════════════════════════════════════════════
// Super Admin Navigation (AdminLayout — full access)
// ═══════════════════════════════════════════════════════════════════

test.describe('Navigation - Super Admin', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
        await login(page, TEST_USERS.superAdmin)
        await page.waitForURL(/\/admin/)
    })

    test('sidebar has all sections with all links', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')

        // Claims section
        await expect(sidebar.locator('a[href*="/admin/claims"]').first()).toBeVisible({ timeout: 5000 })
        await expect(sidebar.locator('a[href*="/admin/my-claims"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="create-claim"]').first()).toBeVisible()

        // General section — all 7 links
        await expect(sidebar.locator('a[href*="/admin/users"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/departments"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/cost-centre"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/account-numbers"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/tags"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/settings"]').first()).toBeVisible()
        await expect(sidebar.locator('a[href*="/admin/dashboard"]').first()).toBeVisible()
    })

    test('can navigate between all admin pages', async ({ page }) => {
        const sidebar = page.locator('aside[role="navigation"], nav')

        await sidebar.locator('a[href*="/admin/users"]').first().click()
        await expect(page).toHaveURL(/\/admin\/users/)

        await sidebar.locator('a[href*="/admin/departments"]').first().click()
        await expect(page).toHaveURL(/\/admin\/departments/)

        await sidebar.locator('a[href*="/admin/cost-centre"]').first().click()
        await expect(page).toHaveURL(/\/admin\/cost-centre/)

        await sidebar.locator('a[href*="/admin/tags"]').first().click()
        await expect(page).toHaveURL(/\/admin\/tags/)

        await sidebar.locator('a[href*="/admin/dashboard"]').first().click()
        await expect(page).toHaveURL(/\/admin\/dashboard/)
    })
})

// ═══════════════════════════════════════════════════════════════════
// Shared: public pages (login, forgot password, 404)
// ═══════════════════════════════════════════════════════════════════

test.describe('Navigation - Public Pages', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
    })

    test('non-existent route shows not found or redirects', async ({ page }) => {
        await page.goto('/this-page-does-not-exist')

        const content = await page.textContent('body')
        const is404orRedirect = content.includes('404') ||
            content.includes('Not Found') ||
            content.includes('notFound') ||
            page.url().includes('/login')
        expect(is404orRedirect).toBeTruthy()
    })

    test('login page has forgot password link', async ({ page }) => {
        await page.goto('/login')

        const forgotLink = page.getByRole('link', { name: /forgot|reset/i })
            .or(page.locator('a[href*="forgot-password"]'))
        await expect(forgotLink.first()).toBeVisible()

        await forgotLink.first().click()
        await expect(page).toHaveURL(/forgot-password/)
    })

    test('forgot password page has email input and submit button', async ({ page }) => {
        await page.goto('/forgot-password')

        await expect(page.getByLabel(/email/i)).toBeVisible()
        await expect(
            page.getByRole('button', { name: /submit|send|reset/i })
        ).toBeVisible()
    })
})
