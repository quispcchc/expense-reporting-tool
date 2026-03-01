import { renderHook, act, waitFor } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext.jsx'
import Cookies from 'js-cookie'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'
import { mockUserData, mockAdminData } from '../mocks/handlers.js'

// Wrapper that includes MemoryRouter (AuthContext imports useNavigate)
const wrapper = ({ children }) => (
    <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
)

describe('AuthContext', () => {
    beforeEach(() => {
        Cookies.get.mockReset()
        Cookies.set.mockReset()
        Cookies.remove.mockReset()
        // Default: no stored cookies so initializeAuth skips server call
        Cookies.get.mockReturnValue(undefined)
    })

    // 1. Provider renders children
    it('renders children inside AuthProvider', () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <div data-testid="child">Hello</div>
                </AuthProvider>
            </MemoryRouter>,
        )
        expect(screen.getByTestId('child')).toHaveTextContent('Hello')
    })

    // 2. useAuth throws outside provider
    it('throws error when useAuth is used outside AuthProvider', () => {
        // Suppress console.error for expected error
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth must be used within AuthProvider',
        )
        spy.mockRestore()
    })

    // 3. login success sets authUser, returns redirectTo /user for regular_user
    it('login success sets authUser, returns redirectTo /user for regular_user', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })

        // Wait for initial loading to finish
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let loginResult
        await act(async () => {
            loginResult = await result.current.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        expect(loginResult.success).toBe(true)
        expect(loginResult.redirectTo).toBe('/user')
        expect(loginResult.user).toEqual(mockUserData)
        expect(result.current.authUser).toEqual(mockUserData)
        // authUser cookie is set (session cookie — no remember flag)
        expect(Cookies.set).toHaveBeenCalledWith('authUser', JSON.stringify(mockUserData), {})
    })

    // 4. login with admin user returns redirectTo /admin
    it('login with admin user returns redirectTo /admin', async () => {
        server.use(
            http.post('/api/login', () =>
                HttpResponse.json({
                    data: {
                        user: mockAdminData,
                    },
                }),
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

        expect(loginResult.success).toBe(true)
        expect(loginResult.redirectTo).toBe('/admin')
        expect(loginResult.user).toEqual(mockAdminData)
    })

    // 5. login failure sets error and returns success: false
    it('login failure sets error and returns success: false', async () => {
        server.use(
            http.post('/api/login', () =>
                HttpResponse.json(
                    { message: 'Invalid credentials' },
                    { status: 422 },
                ),
            ),
        )

        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let loginResult
        await act(async () => {
            loginResult = await result.current.login({
                email: 'wrong@example.com',
                password: 'bad',
            })
        })

        expect(loginResult.success).toBe(false)
        expect(result.current.error).toBeTruthy()
    })

    // 6. logout clears authUser
    it('logout clears authUser', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        // First login
        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        expect(result.current.authUser).toEqual(mockUserData)

        // Then logout
        let logoutResult
        await act(async () => {
            logoutResult = await result.current.logout()
        })

        expect(logoutResult.success).toBe(true)
        expect(result.current.authUser).toBeNull()
        expect(Cookies.remove).toHaveBeenCalledWith('authUser', { path: '/' })
    })

    // 7. forgetPassword success returns success: true
    it('forgetPassword success returns success: true', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let fpResult
        await act(async () => {
            fpResult = await result.current.forgetPassword('test@example.com')
        })

        expect(fpResult.success).toBe(true)
        expect(fpResult.message).toBe('Reset link sent')
    })

    // 8. forgetPassword failure sets error
    it('forgetPassword failure sets error', async () => {
        server.use(
            http.post('/api/forget-password', () =>
                HttpResponse.json(
                    { message: 'Email not found' },
                    { status: 404 },
                ),
            ),
        )

        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let fpResult
        await act(async () => {
            fpResult = await result.current.forgetPassword('nonexistent@example.com')
        })

        expect(fpResult.success).toBe(false)
        expect(result.current.error).toBeTruthy()
    })

    // 9. resetPassword success
    it('resetPassword success returns success: true with message', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let rpResult
        await act(async () => {
            rpResult = await result.current.resetPassword({
                token: 'reset-token',
                email: 'test@example.com',
                password: 'newpassword',
                password_confirmation: 'newpassword',
            })
        })

        expect(rpResult.success).toBe(true)
        expect(rpResult.message).toBe('Password reset successfully')
    })

    // 10. updatePassword success
    it('updatePassword success returns success: true with message', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        let upResult
        await act(async () => {
            upResult = await result.current.updatePassword({
                current_password: 'old',
                password: 'new',
                password_confirmation: 'new',
            })
        })

        expect(upResult.success).toBe(true)
        expect(upResult.message).toEqual({ message: 'Password updated' })
    })

    // 11. isAuthenticated returns false initially (no cookies)
    it('isAuthenticated returns false when no cookies are set', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        expect(result.current.isAuthenticated()).toBe(false)
    })

    // 12. isAuthenticated returns true after login
    it('isAuthenticated returns true after login', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        expect(result.current.isAuthenticated()).toBe(true)
    })

    // 13. login with remember=true sets persistent authUser cookie
    it('login with remember=true sets 30-day authUser cookie', async () => {
        const { result } = renderHook(() => useAuth(), { wrapper })
        await waitFor(() => expect(result.current.isLoading).toBe(false))

        await act(async () => {
            await result.current.login({
                email: 'test@example.com',
                password: 'password',
                remember: true,
            })
        })

        expect(Cookies.set).toHaveBeenCalledWith('authUser', JSON.stringify(mockUserData), { expires: 30 })
    })
})
