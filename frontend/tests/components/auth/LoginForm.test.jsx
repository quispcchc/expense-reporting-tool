import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Mock useAuth from AuthContext
vi.mock('../../../src/contexts/AuthContext.jsx', () => ({
    useAuth: vi.fn(),
}))

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

// Mock react-i18next so t() returns the key
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock LanguageSwitcher to avoid pulling in extra dependencies
vi.mock('../../../src/components/common/ui/LanguageSwitcher.jsx', () => ({
    default: () => null,
}))

import LoginForm from '../../../src/components/feature/auth/LoginForm.jsx'
import { useAuth } from '../../../src/contexts/AuthContext.jsx'

describe('LoginForm', () => {
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

    const renderLoginForm = () => {
        return render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>
        )
    }

    it('renders email and password inputs', () => {
        renderLoginForm()

        // Email input with label key 'users.email'
        const emailInput = screen.getByLabelText('users.email')
        expect(emailInput).toBeInTheDocument()

        // Password input with label key 'auth.password'
        const passwordInput = screen.getByLabelText('auth.password')
        expect(passwordInput).toBeInTheDocument()
    })

    it('renders a submit button', () => {
        renderLoginForm()

        // PrimeReact Button renders a <button> with the label text as content
        const submitButton = screen.getByRole('button', { name: /common\.submit/i })
        expect(submitButton).toBeInTheDocument()
        expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('shows validation errors on empty form submit', async () => {
        const user = userEvent.setup()
        renderLoginForm()

        const submitButton = screen.getByRole('button', { name: /common\.submit/i })
        await user.click(submitButton)

        // Validation messageKeys from schemas.js, resolved through t() mock which returns the key
        await waitFor(() => {
            expect(screen.getByText(/validation\.emailRequired/i)).toBeInTheDocument()
            expect(screen.getByText(/validation\.passwordRequired/i)).toBeInTheDocument()
        })

        // login should NOT have been called
        expect(mockLogin).not.toHaveBeenCalled()
    })

    it('calls login on valid form submit and navigates on success', async () => {
        mockLogin.mockResolvedValue({ success: true, redirectTo: '/dashboard' })

        const user = userEvent.setup()
        renderLoginForm()

        const emailInput = screen.getByLabelText('users.email')
        const passwordInput = screen.getByLabelText('auth.password')
        const submitButton = screen.getByRole('button', { name: /common\.submit/i })

        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'password123')
        await user.click(submitButton)

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                remember: false,
            })
        })

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
    })

    it('displays server error message when login fails', async () => {
        // Re-mock useAuth with an error message
        useAuth.mockReturnValue({
            login: mockLogin,
            error: 'Invalid credentials',
            setError: mockSetError,
        })

        renderLoginForm()

        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
})
