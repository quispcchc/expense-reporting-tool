/**
 * Integration tests for protected route behavior with real AuthContext.
 *
 * Tests verify that routing decisions work correctly based on
 * authentication state and user roles, using MSW for API simulation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../src/contexts/AuthContext.jsx'
import Cookies from 'js-cookie'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'
import { mockUserData, mockAdminData } from '../mocks/handlers.js'

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock Loader
vi.mock('../../src/components/common/ui/Loader.jsx', () => ({
    default: () => <div data-testid="loader">Loading...</div>,
}))

// Import after mocks
import ProtectedRoute from '../../src/components/feature/auth/ProtectedRoute.jsx'
import RootRedirect from '../../src/components/feature/auth/RootRedirect.jsx'

// Helper to render with auth
function renderWithAuth(ui, { initialEntries = ['/'] } = {}) {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <AuthProvider>
                {ui}
            </AuthProvider>
        </MemoryRouter>
    )
}

describe('Protected Route Flow Integration', () => {
    beforeEach(() => {
        Cookies.get.mockReset()
        Cookies.set.mockReset()
        Cookies.remove.mockReset()
        Cookies.get.mockReturnValue(undefined)
    })

    // ─── Unauthenticated → Redirected to Login ──────────────────────

    it('unauthenticated user is redirected to login', async () => {
        renderWithAuth(
            <Routes>
                <Route
                    path="/user"
                    element={
                        <ProtectedRoute allowedRoles={['regular_user']}>
                            <div>User Dashboard</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>,
            { initialEntries: ['/user'] }
        )

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument()
        })
        expect(screen.queryByText('User Dashboard')).not.toBeInTheDocument()
    })

    // ─── Authenticated User → Accesses Protected Route ──────────────

    it('authenticated user can access their protected route', async () => {
        // Simulate stored auth cookie
        Cookies.get.mockReturnValue(JSON.stringify(mockUserData))

        // Server verifies session
        server.use(
            http.get('/api/user', () =>
                HttpResponse.json({ data: mockUserData })
            ),
        )

        renderWithAuth(
            <Routes>
                <Route
                    path="/user"
                    element={
                        <ProtectedRoute allowedRoles={['regular_user']}>
                            <div>User Dashboard</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>,
            { initialEntries: ['/user'] }
        )

        await waitFor(() => {
            expect(screen.getByText('User Dashboard')).toBeInTheDocument()
        })
    })

    // ─── Wrong Role → Shows Unauthorized ────────────────────────────

    it('user with wrong role sees unauthorized page', async () => {
        // Regular user trying to access admin-only route
        Cookies.get.mockReturnValue(JSON.stringify(mockUserData))

        server.use(
            http.get('/api/user', () =>
                HttpResponse.json({ data: mockUserData })
            ),
        )

        renderWithAuth(
            <Routes>
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'approver']}>
                            <div>Admin Dashboard</div>
                        </ProtectedRoute>
                    }
                />
            </Routes>,
            { initialEntries: ['/admin'] }
        )

        await waitFor(() => {
            // ProtectedRoute renders Unauthorized component
            expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
        })
    })

    // ─── Admin Can Access Admin Routes ──────────────────────────────

    it('admin user can access admin protected routes', async () => {
        Cookies.get.mockReturnValue(JSON.stringify(mockAdminData))

        server.use(
            http.get('/api/user', () =>
                HttpResponse.json({ data: mockAdminData })
            ),
        )

        renderWithAuth(
            <Routes>
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['super_admin', 'admin', 'approver']}>
                            <div>Admin Dashboard</div>
                        </ProtectedRoute>
                    }
                />
            </Routes>,
            { initialEntries: ['/admin'] }
        )

        await waitFor(() => {
            expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
        })
    })

    // ─── Root Redirect: Unauthenticated → /login ────────────────────

    it('root redirect sends unauthenticated user to login', async () => {
        renderWithAuth(
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>,
            { initialEntries: ['/'] }
        )

        await waitFor(() => {
            expect(screen.getByText('Login Page')).toBeInTheDocument()
        })
    })

    // ─── Root Redirect: Regular User → /user ────────────────────────

    it('root redirect sends regular user to /user', async () => {
        Cookies.get.mockReturnValue(JSON.stringify(mockUserData))

        server.use(
            http.get('/api/user', () =>
                HttpResponse.json({ data: mockUserData })
            ),
        )

        renderWithAuth(
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/user" element={<div>User Area</div>} />
                <Route path="/admin" element={<div>Admin Area</div>} />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>,
            { initialEntries: ['/'] }
        )

        await waitFor(() => {
            expect(screen.getByText('User Area')).toBeInTheDocument()
        })
    })

    // ─── Root Redirect: Admin → /admin ──────────────────────────────

    it('root redirect sends admin user to /admin', async () => {
        Cookies.get.mockReturnValue(JSON.stringify(mockAdminData))

        server.use(
            http.get('/api/user', () =>
                HttpResponse.json({ data: mockAdminData })
            ),
        )

        renderWithAuth(
            <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/user" element={<div>User Area</div>} />
                <Route path="/admin" element={<div>Admin Area</div>} />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>,
            { initialEntries: ['/'] }
        )

        await waitFor(() => {
            expect(screen.getByText('Admin Area')).toBeInTheDocument()
        })
    })

    // ─── Loading State Shown During Auth Check ──────────────────────

    it('shows loading state while checking authentication', async () => {
        Cookies.get.mockReturnValue(JSON.stringify(mockUserData))

        // Delay server response to test loading state
        server.use(
            http.get('/api/user', async () => {
                await new Promise(resolve => setTimeout(resolve, 100))
                return HttpResponse.json({ data: mockUserData })
            }),
        )

        renderWithAuth(
            <Routes>
                <Route
                    path="/user"
                    element={
                        <ProtectedRoute allowedRoles={['regular_user']}>
                            <div>User Dashboard</div>
                        </ProtectedRoute>
                    }
                />
            </Routes>,
            { initialEntries: ['/user'] }
        )

        // Should show loader initially
        expect(screen.getByTestId('loader')).toBeInTheDocument()

        // Then resolve to content
        await waitFor(() => {
            expect(screen.getByText('User Dashboard')).toBeInTheDocument()
        })
    })

    // ─── Expired Session → Auth State Cleared ──────────────────────

    it('expired session clears auth state when server rejects token', async () => {
        // Make Cookies.get return the stored user initially, then undefined
        // after Cookies.remove is called (simulating real cookie removal)
        let cookieValue = JSON.stringify(mockUserData)
        Cookies.get.mockImplementation(() => cookieValue)
        Cookies.remove.mockImplementation(() => { cookieValue = undefined })

        // Server rejects the expired token
        server.use(
            http.get('/api/user', () =>
                HttpResponse.json(
                    { message: 'Unauthenticated' },
                    { status: 401 }
                ),
            ),
        )

        renderWithAuth(
            <Routes>
                <Route
                    path="/user"
                    element={
                        <ProtectedRoute allowedRoles={['regular_user']}>
                            <div>User Dashboard</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>,
            { initialEntries: ['/user'] }
        )

        // The cookie should be cleared and user should NOT see dashboard
        await waitFor(() => {
            expect(Cookies.remove).toHaveBeenCalledWith('authUser', { path: '/' })
        })
        expect(screen.queryByText('User Dashboard')).not.toBeInTheDocument()
    })
})
