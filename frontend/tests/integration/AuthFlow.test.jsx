/**
 * Integration tests for the full authentication flow.
 *
 * These tests verify multi-step user journeys through the AuthContext
 * and components, using MSW to simulate the backend API.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext.jsx'
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

// Mock LanguageSwitcher
vi.mock('../../src/components/common/ui/LanguageSwitcher.jsx', () => ({
    default: () => null,
}))

// Mock Loader
vi.mock('../../src/components/common/ui/Loader.jsx', () => ({
    default: () => <div data-testid="loader">Loading...</div>,
}))

const wrapper = ({ children }) => (
    <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
)

describe('Auth Flow Integration', () => {
    beforeEach(() => {
        Cookies.get.mockReset()
        Cookies.set.mockReset()
        Cookies.remove.mockReset()
        Cookies.get.mockReturnValue(undefined)
        localStorage.clear()
    })

    // ─── Login → Logout → State Cleared ─────────────────────────────

    it('login sets user, logout clears user and cookie', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        // Login
        let loginResult
        await act(async () => {
            loginResult = await result.current.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        expect(loginResult.success).toBe(true)
        expect(result.current.authUser).toEqual(mockUserData)
        expect(result.current.isAuthenticated()).toBe(true)

        // Logout
        await act(async () => {
            await result.current.logout()
        })

        expect(result.current.authUser).toBeNull()
        expect(result.current.isAuthenticated()).toBe(false)
        expect(Cookies.remove).toHaveBeenCalledWith('authUser', { path: '/' })
    })

    // ─── Login → Role-based redirect ────────────────────────────────

    it('regular user login redirects to /user', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let loginResult
        await act(async () => {
            loginResult = await result.current.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        expect(loginResult.redirectTo).toBe('/user')
    })

    it('admin login redirects to /admin', async () => {
        server.use(
            http.post('/api/login', () =>
                HttpResponse.json({ data: { user: mockAdminData } })
            ),
        )

        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let loginResult
        await act(async () => {
            loginResult = await result.current.login({
                email: 'admin@example.com',
                password: 'password',
            })
        })

        expect(loginResult.redirectTo).toBe('/admin')
    })

    // ─── Forgot password → Reset password flow ─────────────────────

    it('forgot password then reset password completes successfully', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        // Step 1: Request password reset
        let forgotResult
        await act(async () => {
            forgotResult = await result.current.forgetPassword('test@example.com')
        })
        expect(forgotResult.success).toBe(true)

        // Step 2: Reset password with token
        let resetResult
        await act(async () => {
            resetResult = await result.current.resetPassword({
                email: 'test@example.com',
                token: 'reset-token',
                password: 'newpassword123',
                password_confirmation: 'newpassword123',
            })
        })
        expect(resetResult.success).toBe(true)

        // Step 3: Login with new password should succeed
        let loginResult
        await act(async () => {
            loginResult = await result.current.login({
                email: 'test@example.com',
                password: 'newpassword123',
            })
        })
        expect(loginResult.success).toBe(true)
        expect(result.current.authUser).toEqual(mockUserData)
    })

    // ─── Login failure → error state → retry success ────────────────

    it('login failure sets error, then retry succeeds and clears error', async () => {
        // First attempt: server returns 401
        server.use(
            http.post('/api/login', () =>
                HttpResponse.json(
                    { message: 'Invalid credentials' },
                    { status: 401 }
                ),
                { once: true }
            ),
        )

        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        // First login attempt — fails
        let failResult
        await act(async () => {
            failResult = await result.current.login({
                email: 'test@example.com',
                password: 'wrongpassword',
            })
        })
        expect(failResult.success).toBe(false)
        expect(result.current.error).toBeTruthy()

        // Second login attempt — succeeds (default handler returns success)
        let successResult
        await act(async () => {
            successResult = await result.current.login({
                email: 'test@example.com',
                password: 'correctpassword',
            })
        })
        expect(successResult.success).toBe(true)
        expect(result.current.error).toBeNull()
        expect(result.current.authUser).toEqual(mockUserData)
    })

    // ─── Update password → tokens revoked ───────────────────────────

    it('update password succeeds and returns success', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        // Login first
        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
            })
        })
        expect(result.current.authUser).toEqual(mockUserData)

        // Update password
        let updateResult
        await act(async () => {
            updateResult = await result.current.updatePassword({
                current_password: 'password',
                new_password: 'newpassword123',
                new_password_confirmation: 'newpassword123',
            })
        })
        expect(updateResult.success).toBe(true)
    })

    // ─── Remember me cookie persistence ─────────────────────────────

    it('remember me sets persistent cookie, no remember sets session cookie', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        // Login without remember
        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
                remember: false,
            })
        })
        expect(Cookies.set).toHaveBeenCalledWith(
            'authUser',
            JSON.stringify(mockUserData),
            {} // no expires = session cookie
        )

        // Logout
        await act(async () => {
            await result.current.logout()
        })

        Cookies.set.mockClear()

        // Login with remember
        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
                remember: true,
            })
        })
        expect(Cookies.set).toHaveBeenCalledWith(
            'authUser',
            JSON.stringify(mockUserData),
            { expires: 30 }
        )
    })

    // ─── Logout even when API fails ─────────────────────────────────

    it('logout clears local state even if API call fails', async () => {
        server.use(
            http.post('/api/logout', () =>
                HttpResponse.json(
                    { message: 'Server error' },
                    { status: 500 }
                ),
            ),
        )

        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        // Login first
        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
            })
        })
        expect(result.current.authUser).toEqual(mockUserData)

        // Logout — API fails but local state should still be cleared
        let logoutResult
        await act(async () => {
            logoutResult = await result.current.logout()
        })

        expect(logoutResult.success).toBe(true)
        expect(result.current.authUser).toBeNull()
        expect(Cookies.remove).toHaveBeenCalledWith('authUser', { path: '/' })
    })

    // ─── Session restoration from cookie ────────────────────────────

    it('restores auth state from cookie on mount when server verifies', async () => {
        // Simulate a stored user cookie
        Cookies.get.mockReturnValue(JSON.stringify(mockUserData))

        // Server verifies the session
        server.use(
            http.get('/api/user', () =>
                HttpResponse.json({ data: mockUserData })
            ),
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.authUser).toEqual(mockUserData)
    })

    it('clears auth state when server rejects session on mount', async () => {
        // Simulate a stored user cookie
        Cookies.get.mockReturnValue(JSON.stringify(mockUserData))

        // Server rejects — token expired
        server.use(
            http.get('/api/user', () =>
                HttpResponse.json(
                    { message: 'Unauthenticated' },
                    { status: 401 }
                ),
            ),
        )

        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => expect(result.current.isLoading).toBe(false))
        expect(result.current.authUser).toBeNull()
        expect(Cookies.remove).toHaveBeenCalledWith('authUser', { path: '/' })
    })
})
