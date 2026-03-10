import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration.
 *
 * Prerequisites:
 *   1. Start the dev environment:
 *        docker-compose -f docker-compose.dev.yml up -d
 *        cd frontend && npm run dev
 *   2. Seed the database:
 *        docker exec expense_backend_dev php artisan migrate:fresh --seed
 *   3. Run tests:
 *        npx playwright test
 *
 * Test users (from DatabaseSeeder):
 *   - superadmin@example.com / password  (Super Admin)
 *   - admin@example.com / password       (Admin / Dept Manager)
 *   - approver@example.com / password    (Approver / Team Lead)
 *   - test@example.com / password        (Regular User)
 */
export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.spec.js',
    testIgnore: ['**/frontend/**', '**/backend/**', '**/node_modules/**'],
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',
    timeout: 30000,

    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
})
