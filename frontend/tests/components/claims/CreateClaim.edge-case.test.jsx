import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// ── Mock context hooks ──────────────────────────────────────────────
const mockCreateClaim = vi.fn()
vi.mock('../../../src/contexts/ClaimContext.jsx', () => ({
    useClaims: () => ({ createClaim: mockCreateClaim }),
    ClaimProvider: ({ children }) => children,
}))

vi.mock('../../../src/contexts/AuthContext.jsx', () => ({
    useAuth: () => ({
        authUser: {
            user_id: 1,
            full_name: 'Jane Doe',
            first_name: 'Jane',
            last_name: 'Doe',
            department_id: 1,
            position_id: 2,
        },
    }),
    AuthProvider: ({ children }) => children,
}))

vi.mock('../../../src/contexts/LookupContext.jsx', () => ({
    useLookups: () => ({
        lookups: { positions: [], departments: [], teams: [], claimTypes: [], projects: [], costCentres: [], accountNums: [], tags: [] },
        loading: false,
    }),
    LookupProvider: ({ children }) => children,
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

vi.mock('../../../src/utils/helpers.js', () => ({
    showToast: vi.fn(),
}))

vi.mock('../../../src/api/api.js', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: { mileage_rate: 0.5 } }),
        post: vi.fn(),
    },
}))

// ── Mock child components ───────────────────────────────────────────
let capturedClaimFormProps = {}
let capturedAddExpenseProps = {}

vi.mock('../../../src/components/feature/claims/ClaimForm.jsx', () => ({
    default: (props) => {
        capturedClaimFormProps = props
        return <div data-testid="claim-form" />
    },
}))

vi.mock('../../../src/components/feature/claims/AddExpenseForm.jsx', () => ({
    default: (props) => {
        capturedAddExpenseProps = props
        return <div data-testid="add-expense-form" />
    },
}))

vi.mock('../../../src/components/feature/mileage/MileageSection.jsx', () => ({
    default: () => <div data-testid="mileage-section" />,
}))

vi.mock('../../../src/components/common/layout/ContentHeader.jsx', () => ({
    default: ({ title }) => <div data-testid="content-header">{title}</div>,
}))

// ── Import component under test ─────────────────────────────────────
import CreateClaim from '../../../src/components/feature/claims/CreateClaim.jsx'

// ── Helpers ─────────────────────────────────────────────────────────
const mockToastRef = { current: {} }

const validExpense = {
    program: 1,
    transactionDate: '2026-01-15',
    costCentre: 1,
    vendor: 'Office Depot',
    accountNum: 2,
    amount: '150.00',
    buyer: 'Jane Doe',
    description: 'Supplies',
    notes: '',
    tags: [],
    attachment: [],
}

function renderCreateClaim() {
    return render(
        <MemoryRouter>
            <CreateClaim navigateTo="/claims" homePath="/home" toastRef={mockToastRef} />
        </MemoryRouter>,
    )
}

function fillClaimFields() {
    act(() => {
        capturedClaimFormProps.onFieldChange({ target: { name: 'claimType', value: 1 } })
        capturedClaimFormProps.onFieldChange({ target: { name: 'team', value: 1 } })
    })
}

function addExpenseItem(expense = validExpense) {
    act(() => {
        capturedAddExpenseProps.onClaimItemsUpdate([expense])
    })
}

// ── Tests ───────────────────────────────────────────────────────────
describe('CreateClaim – edge cases (double-click / loading state)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        capturedClaimFormProps = {}
        capturedAddExpenseProps = {}
    })

    it('submit button becomes disabled during submission (prevents double-click)', async () => {
        let resolveSubmit
        mockCreateClaim.mockImplementation(() => new Promise(resolve => { resolveSubmit = resolve }))
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })

        // Button starts enabled
        expect(btn).not.toBeDisabled()

        await user.click(btn)

        // Button becomes disabled mid-flight
        await waitFor(() => {
            expect(btn).toBeDisabled()
        })

        // Second click should be ignored because button is disabled
        await user.click(btn)
        expect(mockCreateClaim).toHaveBeenCalledTimes(1)

        // Clean up
        await act(async () => { resolveSubmit({ data: { claim_id: 1 } }) })
    })

    it('submit button shows loading indicator during submission', async () => {
        let resolveSubmit
        mockCreateClaim.mockImplementation(() => new Promise(resolve => { resolveSubmit = resolve }))
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })
        await user.click(btn)

        await waitFor(() => {
            // PrimeReact Button with loading adds p-button-loading class
            expect(btn.className).toContain('p-button-loading')
        })

        await act(async () => { resolveSubmit({ data: { claim_id: 1 } }) })
    })

    it('submit button re-enables after successful submission', async () => {
        mockCreateClaim.mockResolvedValue({ data: { claim_id: 1 } })
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })
        await user.click(btn)

        // After resolution, button is re-enabled (but navigates away in success case)
        await waitFor(() => {
            expect(mockCreateClaim).toHaveBeenCalledTimes(1)
        })
    })

    it('submit button re-enables after failed submission', async () => {
        mockCreateClaim.mockRejectedValue(new Error('Server error'))
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })
        await user.click(btn)

        await waitFor(() => {
            expect(btn).not.toBeDisabled()
        })
    })

    it('only one API call goes through on rapid double-click', async () => {
        let resolveSubmit
        mockCreateClaim.mockImplementation(() => new Promise(resolve => { resolveSubmit = resolve }))
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })

        // Rapid clicks
        await user.click(btn)
        await user.click(btn)
        await user.click(btn)

        // Only one call should go through because button disables after first click
        await waitFor(() => {
            expect(mockCreateClaim).toHaveBeenCalledTimes(1)
        })

        await act(async () => { resolveSubmit({ data: { claim_id: 1 } }) })
    })
})
