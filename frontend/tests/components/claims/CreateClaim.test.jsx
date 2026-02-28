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

const mockAuthUser = {
    user_id: 1,
    full_name: 'Jane Doe',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    role_name: 'regular_user',
    department_id: 1,
    position_id: 2,
}

vi.mock('../../../src/contexts/AuthContext.jsx', () => ({
    useAuth: () => ({ authUser: mockAuthUser }),
    AuthProvider: ({ children }) => children,
}))

vi.mock('../../../src/contexts/LookupContext.jsx', () => ({
    useLookups: () => ({    
        lookups: { positions: [], departments: [], teams: [], claimTypes: [], projects: [], costCentres: [], accountNums: [], tags: [] },
        loading: false,
    }),
    LookupProvider: ({ children }) => children,
}))

// ── Mock navigation ─────────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return { ...actual, useNavigate: () => mockNavigate }
})

// ── Mock i18n ───────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// ── Mock showToast ──────────────────────────────────────────────────
const mockShowToast = vi.fn()
vi.mock('../../../src/utils/helpers.js', () => ({
    showToast: (...args) => mockShowToast(...args),
}))

// ── Mock API (for settings fetch) ───────────────────────────────────
vi.mock('../../../src/api/api.js', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: { mileage_rate: 0.5 } }),
        post: vi.fn(),
    },
}))

// ── Mock child components ───────────────────────────────────────────
// Store refs to captured props so tests can call callbacks
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

// Helper to set claim form fields via the mocked ClaimForm's onFieldChange
function fillClaimFields() {
    act(() => {
        capturedClaimFormProps.onFieldChange({ target: { name: 'claimType', value: 1 } })
        capturedClaimFormProps.onFieldChange({ target: { name: 'team', value: 1 } })
    })
}

// Helper to inject an expense into claimItems via AddExpenseForm's callback
function addExpenseItem(expense = validExpense) {
    act(() => {
        capturedAddExpenseProps.onClaimItemsUpdate([expense])
    })
}

// ── Tests ───────────────────────────────────────────────────────────
describe('CreateClaim submit workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        capturedClaimFormProps = {}
        capturedAddExpenseProps = {}
    })

    // ==================== RENDERING ====================

    it('renders the submit button', () => {
        renderCreateClaim()
        const btn = screen.getByRole('button', { name: /Submit claim/i })
        expect(btn).toBeInTheDocument()
        expect(btn).toHaveAttribute('type', 'submit')
    })

    it('renders child components', () => {
        renderCreateClaim()
        expect(screen.getByTestId('claim-form')).toBeInTheDocument()
        expect(screen.getByTestId('add-expense-form')).toBeInTheDocument()
        expect(screen.getByTestId('content-header')).toBeInTheDocument()
    })

    it('pre-fills employeeName from authUser', () => {
        renderCreateClaim()
        expect(capturedClaimFormProps.claimFormData.employeeName).toBe('Jane Doe')
    })

    it('pre-fills position and department from authUser', () => {
        renderCreateClaim()
        expect(capturedClaimFormProps.claimFormData.position).toBe(2)
        expect(capturedClaimFormProps.claimFormData.department).toBe(1)
    })

    // ==================== VALIDATION — NO EXPENSES ====================

    it('shows dialog when submitting with no expenses', async () => {
        const user = userEvent.setup()
        renderCreateClaim()

        // Fill required claim fields so we pass claim validation
        fillClaimFields()

        const btn = screen.getByRole('button', { name: /Submit claim/i })
        await user.click(btn)

        await waitFor(() => {
            expect(screen.getByText(/Please add at least one expense before submitting/i)).toBeInTheDocument()
        })
        expect(mockCreateClaim).not.toHaveBeenCalled()
    })

    // ==================== VALIDATION — MISSING CLAIM FIELDS ====================

    it('shows dialog when required claim fields are missing', async () => {
        const user = userEvent.setup()
        renderCreateClaim()

        // Add expense but don't fill claim fields (claimType and team are empty)
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })
        await user.click(btn)

        await waitFor(() => {
            expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument()
        })
        expect(mockCreateClaim).not.toHaveBeenCalled()
    })

    // ==================== SUCCESSFUL SUBMISSION ====================

    it('calls createClaim with FormData on valid submission', async () => {
        mockCreateClaim.mockResolvedValue({ data: { claim_id: 1 } })
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })
        await user.click(btn)

        await waitFor(() => {
            expect(mockCreateClaim).toHaveBeenCalledTimes(1)
        })

        const formData = mockCreateClaim.mock.calls[0][0]
        expect(formData).toBeInstanceOf(FormData)
    })

    it('FormData contains correct claim fields', async () => {
        mockCreateClaim.mockResolvedValue({ data: { claim_id: 1 } })
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        await user.click(screen.getByRole('button', { name: /Submit claim/i }))

        await waitFor(() => {
            expect(mockCreateClaim).toHaveBeenCalled()
        })

        const formData = mockCreateClaim.mock.calls[0][0]
        expect(formData.get('position_id')).toBe('2')
        expect(formData.get('claim_type_id')).toBe('1')
        expect(formData.get('department_id')).toBe('1')
        expect(formData.get('team_id')).toBe('1')
    })

    it('FormData contains correct expense fields', async () => {
        mockCreateClaim.mockResolvedValue({ data: { claim_id: 1 } })
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        await user.click(screen.getByRole('button', { name: /Submit claim/i }))

        await waitFor(() => {
            expect(mockCreateClaim).toHaveBeenCalled()
        })

        const formData = mockCreateClaim.mock.calls[0][0]
        expect(formData.get('expenses[0][transaction_date]')).toBe('2026-01-15')
        expect(formData.get('expenses[0][buyer_name]')).toBe('Jane Doe')
        expect(formData.get('expenses[0][vendor_name]')).toBe('Office Depot')
        expect(formData.get('expenses[0][expense_amount]')).toBe('150.00')
        expect(formData.get('expenses[0][project_id]')).toBe('1')
        expect(formData.get('expenses[0][cost_centre_id]')).toBe('1')
        expect(formData.get('expenses[0][account_number_id]')).toBe('2')
    })

    it('navigates with flash message on success', async () => {
        mockCreateClaim.mockResolvedValue({ data: { claim_id: 1 } })
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        await user.click(screen.getByRole('button', { name: /Submit claim/i }))

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/claims', {
                state: { flashMessage: 'claims.submitSuccess' },
            })
        })
    })

    // ==================== ERROR HANDLING ====================

    it('shows error toast when createClaim throws', async () => {
        mockCreateClaim.mockRejectedValue(new Error('Network error'))
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        await user.click(screen.getByRole('button', { name: /Submit claim/i }))

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                mockToastRef,
                expect.objectContaining({
                    severity: 'error',
                    summary: 'claims.submitFailed',
                    detail: 'Network error',
                }),
            )
        })
    })

    it('does NOT navigate on error', async () => {
        mockCreateClaim.mockRejectedValue(new Error('Server error'))
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        await user.click(screen.getByRole('button', { name: /Submit claim/i }))

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalled()
        })
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    // ==================== LOADING STATE ====================

    it('submit button is disabled while submitting', async () => {
        // Make createClaim hang so we can check the button state mid-flight
        let resolveSubmit
        mockCreateClaim.mockImplementation(() => new Promise(resolve => { resolveSubmit = resolve }))

        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()
        addExpenseItem()

        const btn = screen.getByRole('button', { name: /Submit claim/i })
        await user.click(btn)

        await waitFor(() => {
            expect(btn).toBeDisabled()
        })

        // Resolve the pending promise to clean up
        await act(async () => { resolveSubmit({ data: { claim_id: 1 } }) })
    })

    it('submit button re-enables after error', async () => {
        mockCreateClaim.mockRejectedValue(new Error('fail'))
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

    // ==================== TOTAL AMOUNT ====================

    it('displays total amount from expenses', async () => {
        renderCreateClaim()

        addExpenseItem({ ...validExpense, amount: '250.00' })

        await waitFor(() => {
            expect(screen.getByText('$250.00')).toBeInTheDocument()
        })
    })

    it('FormData total_amount sums multiple expenses', async () => {
        mockCreateClaim.mockResolvedValue({ data: { claim_id: 1 } })
        const user = userEvent.setup()
        renderCreateClaim()

        fillClaimFields()

        const expense1 = { ...validExpense, amount: '100.00' }
        const expense2 = { ...validExpense, amount: '50.00', vendor: 'Amazon' }
        act(() => {
            capturedAddExpenseProps.onClaimItemsUpdate([expense1, expense2])
        })

        await user.click(screen.getByRole('button', { name: /Submit claim/i }))

        await waitFor(() => {
            expect(mockCreateClaim).toHaveBeenCalled()
        })

        const formData = mockCreateClaim.mock.calls[0][0]
        expect(formData.get('total_amount')).toBe('150')
    })
})
