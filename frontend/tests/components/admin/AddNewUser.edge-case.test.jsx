import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mock contexts ───────────────────────────────────────────────────
const mockCreateUser = vi.fn()
vi.mock('../../../src/contexts/UserContext.jsx', () => ({
    useUserDispatch: () => ({ createUser: mockCreateUser }),
}))

vi.mock('../../../src/contexts/LookupContext.jsx', () => ({
    useLookups: () => ({
        lookups: {
            roles: [
                { role_id: 1, role_name: 'super_admin', role_level: 1 },
                { role_id: 4, role_name: 'regular_user', role_level: 4 },
            ],
            departments: [
                { department_id: 1, department_name: 'Engineering' },
            ],
            teams: [
                { team_id: 1, team_name: 'Alpha', department_id: 1 },
            ],
        },
        loading: false,
    }),
    LookupProvider: ({ children }) => children,
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../../src/utils/helpers.js', () => ({
    showToast: vi.fn(),
}))

// Mock validation to bypass form validation for loading-state tests
const mockValidateForm = vi.fn()
vi.mock('../../../src/utils/validation/validator.js', () => ({
    validateForm: (...args) => mockValidateForm(...args),
}))

vi.mock('../../../src/utils/validation/schemas.js', () => ({
    validationSchemas: { addUser: {} },
}))

// ── Import component ────────────────────────────────────────────────
import AddNewUser from '../../../src/components/feature/user/AddNewUser.jsx'

describe('AddNewUser – edge cases (double-click / loading state)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default: validation passes
        mockValidateForm.mockReturnValue({ isValid: true, errors: {} })
    })

    const renderAndOpen = async () => {
        const user = userEvent.setup()
        render(<AddNewUser />)

        // Toggle the form open
        const toggleBtn = screen.getByRole('button')
        await user.click(toggleBtn)

        return user
    }

    it('save button is disabled and shows loading during submission', async () => {
        let resolveCreate
        mockCreateUser.mockImplementation(() => new Promise(resolve => { resolveCreate = resolve }))

        const user = await renderAndOpen()

        const saveBtn = screen.getByRole('button', { name: /common\.save/i })
        await user.click(saveBtn)

        // Button should become disabled during submission
        await waitFor(() => {
            expect(saveBtn).toBeDisabled()
        })

        // Clean up
        await act(async () => { resolveCreate({ success: true }) })
    })

    it('cancel button is also disabled during submission', async () => {
        let resolveCreate
        mockCreateUser.mockImplementation(() => new Promise(resolve => { resolveCreate = resolve }))

        const user = await renderAndOpen()

        const saveBtn = screen.getByRole('button', { name: /common\.save/i })
        const cancelBtn = screen.getByRole('button', { name: /common\.cancel/i })

        await user.click(saveBtn)

        await waitFor(() => {
            expect(cancelBtn).toBeDisabled()
        })

        await act(async () => { resolveCreate({ success: true }) })
    })

    it('only one API call on rapid double-click of save', async () => {
        let resolveCreate
        mockCreateUser.mockImplementation(() => new Promise(resolve => { resolveCreate = resolve }))

        const user = await renderAndOpen()

        const saveBtn = screen.getByRole('button', { name: /common\.save/i })

        // Rapid clicks
        await user.click(saveBtn)
        await user.click(saveBtn)
        await user.click(saveBtn)

        // Only one call because button disables after first click
        await waitFor(() => {
            expect(mockCreateUser).toHaveBeenCalledTimes(1)
        })

        await act(async () => { resolveCreate({ success: true }) })
    })

    it('save button re-enables after failed submission', async () => {
        mockCreateUser.mockResolvedValue({ success: false, error: 'Email taken' })

        const user = await renderAndOpen()

        const saveBtn = screen.getByRole('button', { name: /common\.save/i })
        await user.click(saveBtn)

        await waitFor(() => {
            expect(saveBtn).not.toBeDisabled()
        })
    })

    it('form inputs are disabled during submission', async () => {
        let resolveCreate
        mockCreateUser.mockImplementation(() => new Promise(resolve => { resolveCreate = resolve }))

        const user = await renderAndOpen()

        await user.click(screen.getByRole('button', { name: /common\.save/i }))

        await waitFor(() => {
            expect(screen.getByLabelText('users.firstName')).toBeDisabled()
            expect(screen.getByLabelText('users.lastName')).toBeDisabled()
            expect(screen.getByLabelText('users.email')).toBeDisabled()
        })

        await act(async () => { resolveCreate({ success: true }) })
    })

    it('does not call API when validation fails', async () => {
        mockValidateForm.mockReturnValue({
            isValid: false,
            errors: { first_name: 'validation.firstNameRequired' },
        })

        const user = await renderAndOpen()

        const saveBtn = screen.getByRole('button', { name: /common\.save/i })
        await user.click(saveBtn)

        expect(mockCreateUser).not.toHaveBeenCalled()
    })
})
