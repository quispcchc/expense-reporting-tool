import { test, expect } from '@playwright/test'
import { TEST_USERS, login, loginAndExpect, logout } from './helpers/auth.js'

test.describe('Authentication E2E', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().clearCookies()
    })

    // ─── Login & Role-Based Redirect ────────────────────────────────

    test('super admin logs in and is redirected to /admin', async ({ page }) => {
        await loginAndExpect(page, TEST_USERS.superAdmin)
        await expect(page).toHaveURL(/\/admin/)
    })

    test('admin logs in and is redirected to /admin', async ({ page }) => {
        await loginAndExpect(page, TEST_USERS.admin)
        await expect(page).toHaveURL(/\/admin/)
    })

    test('approver logs in and is redirected to /admin', async ({ page }) => {
        await loginAndExpect(page, TEST_USERS.approver)
        await expect(page).toHaveURL(/\/admin/)
    })

    test('regular user logs in and is redirected to /user', async ({ page }) => {
        await loginAndExpect(page, TEST_USERS.user)
        await expect(page).toHaveURL(/\/user\/claims/)
    })

    // ─── Login Failures ─────────────────────────────────────────────

    test('login with wrong password shows error', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel(/email/i).fill(TEST_USERS.user.email)
        await page.getByLabel(/password/i).fill('wrongpassword')
        await page.getByRole('button', { name: /submit|login|sign in/i }).click()

        await expect(page).toHaveURL(/\/login/)
        await expect(page.locator('.bg-red-100, [role="alert"]').first()).toBeVisible({ timeout: 5000 })
    })

    test('login with empty form shows validation errors', async ({ page }) => {
        await page.goto('/login')
        await page.getByRole('button', { name: /submit|login|sign in/i }).click()

        await expect(page).toHaveURL(/\/login/)
        await expect(page.locator('.text-red-500, .p-error').first()).toBeVisible({ timeout: 5000 })
    })

    // ─── Logout ─────────────────────────────────────────────────────

    test('super admin can logout', async ({ page }) => {
        await login(page, TEST_USERS.superAdmin)
        await page.waitForURL(/\/admin/)
        await logout(page)
        await expect(page).toHaveURL(/\/login/)
    })

    test('regular user can logout', async ({ page }) => {
        await login(page, TEST_USERS.user)
        await page.waitForURL(/\/user/)
        await logout(page)
        await expect(page).toHaveURL(/\/login/)
    })

    // ─── Unauthenticated Access Blocked ─────────────────────────────

    test('unauthenticated user is redirected from /user to /login', async ({ page }) => {
        await page.goto('/user/claims')
        await expect(page).toHaveURL(/\/login/)
    })

    test('unauthenticated user is redirected from /admin to /login', async ({ page }) => {
        await page.goto('/admin/claims')
        await expect(page).toHaveURL(/\/login/)
    })

    test('unauthenticated root redirects to /login', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveURL(/\/login/)
    })

    // ─── Authenticated Root Redirect ────────────────────────────────

    test('authenticated regular user root redirects to /user', async ({ page }) => {
        await login(page, TEST_USERS.user)
        await page.goto('/')
        await expect(page).toHaveURL(/\/user/)
    })

    test('authenticated admin root redirects to /admin', async ({ page }) => {
        await login(page, TEST_USERS.superAdmin)
        await page.goto('/')
        await expect(page).toHaveURL(/\/admin/)
    })

    // ─── Role-Based Route Protection ────────────────────────────────

    test('regular user cannot access /admin pages', async ({ page }) => {
        await login(page, TEST_USERS.user)
        await page.goto('/admin/claims')

        // Wait for either a redirect or the Access Denied page to render
        await page.waitForLoadState('networkidle')
        await expect(
            page.getByText(/Access Denied/i)
                .or(page.getByText(/unauthorized/i))
        ).toBeVisible({ timeout: 10000 })
            .catch(() => {
                // If no Access Denied text, check URL was redirected
                const url = page.url()
                expect(
                    url.includes('/user') || url.includes('/login')
                ).toBeTruthy()
            })
    })

    // ─── Remember Me ────────────────────────────────────────────────

    test('remember me persists email on reload', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel(/email/i).fill(TEST_USERS.user.email)
        await page.getByLabel(/remember/i).check()
        await page.getByLabel(/password/i).fill(TEST_USERS.user.password)
        await page.getByRole('button', { name: /submit|login|sign in/i }).click()
        await page.waitForURL(/\/user/)

        await logout(page)

        const emailValue = await page.getByLabel(/email/i).inputValue()
        expect(emailValue).toBe(TEST_USERS.user.email)
    })
})
