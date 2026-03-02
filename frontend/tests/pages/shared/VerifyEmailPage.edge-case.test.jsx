import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, opts) => {
            // Return string only — avoid passing objects as React children
            if (typeof opts === 'object' && opts !== null) return key
            return opts || key
        },
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../../src/api/api.js', () => ({
    default: { post: vi.fn() },
}))

vi.mock('../../../src/utils/helpers.js', () => ({
    showToast: vi.fn(),
}))

import VerifyEmailPage from '../../../src/pages/shared/VerifyEmailPage.jsx'
import api from '../../../src/api/api.js'
import { showToast } from '../../../src/utils/helpers.js'

describe('VerifyEmailPage – edge cases', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers({ shouldAdvanceTime: true })
        // Default: verification check returns not verified
        api.post.mockResolvedValue({ data: { is_verified: false } })
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const renderPage = (search = '?email=test@example.com&token=abc123') =>
        render(
            <MemoryRouter initialEntries={[`/verify-email${search}`]}>
                <Routes>
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                </Routes>
            </MemoryRouter>,
        )

    it('shows error toast when email/token params are missing', async () => {
        renderPage('')

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ severity: 'error' }),
            )
        })
    })

    it('resend button is disabled during resend (prevents double-click)', async () => {
        api.post
            .mockResolvedValueOnce({ data: { is_verified: false } }) // verification check
            .mockImplementationOnce(() => new Promise(() => {})) // resend hangs

        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        renderPage()

        // Wait for initial check
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/check-email-verification', { email: 'test@example.com' })
        })

        const resendBtn = screen.getByRole('button', { name: /verify\.resendButton|verify\.sending/i })
        await user.click(resendBtn)

        await waitFor(() => {
            expect(resendBtn).toBeDisabled()
        })
    })

    it('redirect timer fires after successful verification', async () => {
        api.post
            .mockResolvedValueOnce({ data: { is_verified: false } }) // verification check
            .mockResolvedValueOnce({ data: { message: 'Verified' } }) // verify-email

        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        renderPage()

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/check-email-verification', { email: 'test@example.com' })
        })

        // Fill password fields using PrimeReact Password component
        const passwordInputs = screen.getAllByPlaceholderText(/password/i)
        await user.type(passwordInputs[0], 'Password123')
        await user.type(passwordInputs[1], 'Password123')

        await user.click(screen.getByRole('button', { name: /verify\.verifyButton|verify\.verifying/i }))

        // Wait for success toast
        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ severity: 'success' }),
            )
        })

        // Navigate should not have been called yet
        expect(mockNavigate).not.toHaveBeenCalled()

        // Advance timer by 2 seconds
        await act(async () => { vi.advanceTimersByTime(2000) })

        expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('redirect timer is cleared on unmount (no stale navigation)', async () => {
        api.post
            .mockResolvedValueOnce({ data: { is_verified: false } }) // verification check
            .mockResolvedValueOnce({ data: { message: 'Verified' } }) // verify-email

        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        const { unmount } = renderPage()

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/check-email-verification', { email: 'test@example.com' })
        })

        const passwordInputs = screen.getAllByPlaceholderText(/password/i)
        await user.type(passwordInputs[0], 'Password123')
        await user.type(passwordInputs[1], 'Password123')

        await user.click(screen.getByRole('button', { name: /verify\.verifyButton|verify\.verifying/i }))

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ severity: 'success' }),
            )
        })

        // Unmount before timer fires
        unmount()

        // Advance timer — navigate should NOT be called since component unmounted
        await act(async () => { vi.advanceTimersByTime(2000) })
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('shows already verified UI when check returns verified', async () => {
        api.post.mockResolvedValueOnce({ data: { is_verified: true, message: 'Already verified' } })

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('verify.alreadyVerifiedTitle')).toBeInTheDocument()
        })
    })

    it('shows validation errors when password fields are empty', async () => {
        api.post.mockResolvedValueOnce({ data: { is_verified: false } }) // verification check

        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
        renderPage()

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/check-email-verification', { email: 'test@example.com' })
        })

        const verifyBtn = screen.getByRole('button', { name: /verify\.verifyButton|verify\.verifying/i })
        await user.click(verifyBtn)

        // Validation errors should be visible
        await waitFor(() => {
            expect(screen.getByText('validation.passwordRequired')).toBeInTheDocument()
        })
    })
})
