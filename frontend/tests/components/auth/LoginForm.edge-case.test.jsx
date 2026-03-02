import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Mock useAuth
vi.mock('../../../src/contexts/AuthContext.jsx', () => ({
    useAuth: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../../src/components/common/ui/LanguageSwitcher.jsx', () => ({
    default: () => null,
}))

import LoginForm from '../../../src/components/feature/auth/LoginForm.jsx'
import { useAuth } from '../../../src/contexts/AuthContext.jsx'

describe('LoginForm – edge cases', () => {
    let mockLogin
    let mockSetError

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()

        mockLogin = vi.fn()
        mockSetError = vi.fn()

        useAuth.mockReturnValue({
            login: mockLogin,
            error: null,
            setError: mockSetError,
        })
    })

    const renderLoginForm = () =>
        render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>,
        )

    it('does not call login when form is submitted with empty fields', async () => {
        const user = userEvent.setup()
        renderLoginForm()

        const btn = screen.getByRole('button', { name: /common\.submit/i })
        await user.click(btn)

        await waitFor(() => {
            expect(mockLogin).not.toHaveBeenCalled()
        })
    })

    it('calls login when submitted with valid credentials', async () => {
        mockLogin.mockResolvedValue({ success: true, redirectTo: '/dashboard' })
        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByLabelText('users.email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password123')
        await user.click(screen.getByRole('button', { name: /common\.submit/i }))

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledTimes(1)
        })
    })

    it('submit button is disabled during login request (loading guard)', async () => {
        mockLogin.mockImplementation(() => new Promise(() => {}))
        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByLabelText('users.email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password123')

        const btn = screen.getByRole('button', { name: /common\.submit/i })
        await user.click(btn)

        await waitFor(() => {
            expect(btn).toBeDisabled()
        })
    })

    it('only one login call on rapid double-click (loading guard prevents duplicates)', async () => {
        let resolveLogin
        mockLogin.mockImplementation(() => new Promise(resolve => { resolveLogin = resolve }))
        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByLabelText('users.email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password123')

        const btn = screen.getByRole('button', { name: /common\.submit/i })

        // Click twice rapidly
        await user.click(btn)
        await user.click(btn)

        // Only one call should go through
        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledTimes(1)
        })

        await act(async () => { resolveLogin({ success: true, redirectTo: '/dashboard' }) })
    })

    it('submit button re-enables after failed login', async () => {
        mockLogin.mockResolvedValue({ success: false })
        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByLabelText('users.email'), 'test@example.com')
        await user.type(screen.getByLabelText('Password'), 'password123')

        const btn = screen.getByRole('button', { name: /common\.submit/i })
        await user.click(btn)

        await waitFor(() => {
            expect(btn).not.toBeDisabled()
        })
    })

    it('does not call login with only email filled', async () => {
        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByLabelText('users.email'), 'test@example.com')
        await user.click(screen.getByRole('button', { name: /common\.submit/i }))

        await waitFor(() => {
            expect(mockLogin).not.toHaveBeenCalled()
        })
    })

    it('does not call login with only password filled', async () => {
        const user = userEvent.setup()
        renderLoginForm()

        await user.type(screen.getByLabelText('Password'), 'password123')
        await user.click(screen.getByRole('button', { name: /common\.submit/i }))

        await waitFor(() => {
            expect(mockLogin).not.toHaveBeenCalled()
        })
    })
})
