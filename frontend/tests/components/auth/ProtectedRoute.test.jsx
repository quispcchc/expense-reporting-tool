import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock useAuth
vi.mock('../../../src/contexts/AuthContext.jsx', () => ({
    useAuth: vi.fn(),
}))

// Mock heavy components to simple stubs
vi.mock('../../../src/pages/shared/Unauthrized.jsx', () => ({
    default: ({ requiredRoles }) => <div data-testid="unauthorized">Unauthorized</div>,
}))

vi.mock('../../../src/components/common/ui/Loader.jsx', () => ({
    default: () => <div data-testid="loader">Loading...</div>,
}))

import ProtectedRoute from '../../../src/components/feature/auth/ProtectedRoute.jsx'
import { useAuth } from '../../../src/contexts/AuthContext.jsx'

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows Loader when isLoading is true', () => {
        useAuth.mockReturnValue({
            authUser: null,
            isAuthenticated: () => false,
            isLoading: true,
        })

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div>Protected Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        )

        expect(screen.getByTestId('loader')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('redirects to /login when not authenticated', () => {
        useAuth.mockReturnValue({
            authUser: null,
            isAuthenticated: () => false,
            isLoading: false,
        })

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <div>Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('Login Page')).toBeInTheDocument()
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('shows Unauthorized when role is not in allowedRoles', () => {
        useAuth.mockReturnValue({
            authUser: { role_name: 'regular_user', role: 'regular_user' },
            isAuthenticated: () => true,
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ProtectedRoute allowedRoles={['super_admin']}>
                    <div>Admin Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        )

        expect(screen.getByTestId('unauthorized')).toBeInTheDocument()
        expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })

    it('renders children when authenticated and role matches allowedRoles', () => {
        useAuth.mockReturnValue({
            authUser: { role_name: 'super_admin', role: 'super_admin' },
            isAuthenticated: () => true,
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ProtectedRoute allowedRoles={['super_admin']}>
                    <div>Admin Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        )

        expect(screen.getByText('Admin Content')).toBeInTheDocument()
        expect(screen.queryByTestId('unauthorized')).not.toBeInTheDocument()
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    })

    it('renders children when allowedRoles is empty and user is authenticated', () => {
        useAuth.mockReturnValue({
            authUser: { role_name: 'regular_user', role: 'regular_user' },
            isAuthenticated: () => true,
            isLoading: false,
        })

        render(
            <MemoryRouter>
                <ProtectedRoute>
                    <div>Any Authenticated Content</div>
                </ProtectedRoute>
            </MemoryRouter>
        )

        expect(screen.getByText('Any Authenticated Content')).toBeInTheDocument()
        expect(screen.queryByTestId('unauthorized')).not.toBeInTheDocument()
    })
})
