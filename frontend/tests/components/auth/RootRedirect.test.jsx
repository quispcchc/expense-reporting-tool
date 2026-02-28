import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}))

vi.mock('../../../src/contexts/AuthContext.jsx', () => ({
    useAuth: vi.fn(),
}))

import RootRedirect from '../../../src/components/feature/auth/RootRedirect.jsx'
import { useAuth } from '../../../src/contexts/AuthContext.jsx'

describe('RootRedirect', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows loading text when isLoading is true', () => {
        useAuth.mockReturnValue({
            isAuthenticated: () => false,
            authUser: null,
            isLoading: true,
        })

        render(
            <MemoryRouter>
                <RootRedirect />
            </MemoryRouter>
        )

        expect(screen.getByText('common.loading')).toBeInTheDocument()
    })

    it('redirects regular_user to /user', () => {
        useAuth.mockReturnValue({
            isAuthenticated: () => true,
            authUser: { role_name: 'regular_user' },
            isLoading: false,
        })

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/user" element={<div>User Dashboard</div>} />
                    <Route path="/admin" element={<div>Admin Dashboard</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('User Dashboard')).toBeInTheDocument()
        expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
    })

    it('redirects super_admin to /admin', () => {
        useAuth.mockReturnValue({
            isAuthenticated: () => true,
            authUser: { role_name: 'super_admin' },
            isLoading: false,
        })

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/user" element={<div>User Dashboard</div>} />
                    <Route path="/admin" element={<div>Admin Dashboard</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
        expect(screen.queryByText('User Dashboard')).not.toBeInTheDocument()
    })

    it('redirects to /login when not authenticated', () => {
        useAuth.mockReturnValue({
            isAuthenticated: () => false,
            authUser: null,
            isLoading: false,
        })

        render(
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
})
