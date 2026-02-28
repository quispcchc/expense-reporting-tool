import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mocks ──────────────────────────────────────────

vi.mock('../../../src/contexts/UserContext.jsx', () => ({
    useUser: vi.fn(),
    useUserDispatch: vi.fn(),
}))

vi.mock('../../../src/contexts/LookupContext.jsx', () => ({
    useLookups: vi.fn(),
}))

vi.mock('../../../src/hooks/useIsMobile.js', () => ({
    useIsMobile: () => false, // always render desktop view
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('../../../src/components/common/layout/ContentHeader.jsx', () => ({
    default: () => <div data-testid="content-header" />,
}))

vi.mock('../../../src/components/feature/user/AddNewUser.jsx', () => ({
    default: () => <div data-testid="add-new-user" />,
}))

vi.mock('../../../src/components/common/ui/ActiveStatusTab.jsx', () => ({
    default: ({ status }) => <span data-testid="status-tab">{status}</span>,
}))

import UsersPage from '../../../src/pages/admin/UsersPage.jsx'
import { useUser, useUserDispatch } from '../../../src/contexts/UserContext.jsx'
import { useLookups } from '../../../src/contexts/LookupContext.jsx'

// ── Test Data ──────────────────────────────────────

const mockLookups = {
    departments: [
        { department_id: 1, department_name: 'Engineering' },
        { department_id: 2, department_name: 'Marketing' },
    ],
    teams: [
        { team_id: 1, team_name: 'Frontend', team_abbreviation: 'FE', department_id: 1 },
        { team_id: 2, team_name: 'Backend', team_abbreviation: 'BE', department_id: 1 },
        { team_id: 3, team_name: 'Social Media', team_abbreviation: 'SM', department_id: 2 },
        { team_id: 4, team_name: 'Content', team_abbreviation: 'CT', department_id: 2 },
    ],
    roles: [
        { role_id: 1, role_name: 'super_admin' },
        { role_id: 2, role_name: 'regular_user' },
    ],
    activeStatuses: [
        { active_status_id: 1, active_status_name: 'Active' },
    ],
}

const mockUsers = [
    {
        user_id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        department_id: 1,
        role_id: 2,
        active_status_id: 1,
        teams: [
            { team_id: 1, team_name: 'Frontend', team_abbreviation: 'FE' },
        ],
    },
]

// ── Tests ──────────────────────────────────────────

describe('UsersPage – Department & Team editing in DataTable', () => {
    let mockUpdateUser, mockRefresh, mockDeleteUser

    beforeEach(() => {
        vi.clearAllMocks()

        mockUpdateUser = vi.fn().mockResolvedValue({})
        mockRefresh = vi.fn().mockResolvedValue()
        mockDeleteUser = vi.fn().mockResolvedValue()

        useUser.mockReturnValue({
            users: mockUsers,
            loading: false,
            error: null,
        })

        useUserDispatch.mockReturnValue({
            updateUser: mockUpdateUser,
            deleteUser: mockDeleteUser,
            refresh: mockRefresh,
        })

        useLookups.mockReturnValue({
            lookups: mockLookups,
        })
    })

    /** Helpers to navigate the DataTable DOM */
    const getCells = (container) => {
        const tbody = container.querySelector('tbody')
        return tbody?.querySelector('tr')?.querySelectorAll('td')
    }

    // Column indices (matches Column order in UsersPage)
    const COL = { DEPARTMENT: 3, TEAMS: 4 }

    /** Enter row edit mode on the first data row */
    const enterEditMode = async (container, user) => {
        const editButton = container.querySelector('[data-pc-section="roweditorinitbutton"]')
        await user.click(editButton)
        await waitFor(() => {
            expect(getCells(container)[COL.DEPARTMENT].querySelector('.p-dropdown')).toBeTruthy()
        })
    }

    /**
     * Select a PrimeReact Dropdown option via keyboard.
     * Focuses the hidden input, opens with ArrowDown, navigates, then selects with Enter.
     */
    const selectDropdownOption = async (cell, user, optionText) => {
        const input = cell.querySelector('input[data-pc-section="input"]')
        input.focus()

        // Open the dropdown and wait for items
        await act(async () => {
            await user.keyboard('{ArrowDown}')
        })
        await waitFor(() => {
            const items = document.querySelectorAll('[data-pc-section="item"]')
            expect(items.length).toBeGreaterThan(0)
        })

        // Find and click the desired option
        const option = Array.from(document.querySelectorAll('[data-pc-section="item"]'))
            .find(el => el.textContent.trim() === optionText)
        expect(option).toBeTruthy()

        await act(async () => {
            await user.click(option)
        })

        // Wait for the dropdown to close and value to update
        await waitFor(() => {
            expect(input.value).toBe(optionText)
        })
    }

    /** Open a PrimeReact MultiSelect panel and wait for items */
    const openMultiSelect = async (cell, user) => {
        const ms = cell.querySelector('.p-multiselect')
        await user.click(ms)
        await waitFor(() => {
            const panel = document.querySelector('.p-multiselect-panel')
            const items = panel?.querySelectorAll('[data-pc-section="item"]') || []
            expect(items.length).toBeGreaterThan(0)
        })
    }

    /** Get text content of all items in the currently open MultiSelect panel */
    const getMultiSelectItemTexts = () => {
        const panel = document.querySelector('.p-multiselect-panel')
        if (!panel) return []
        const items = panel.querySelectorAll('[data-pc-section="item"]')
        return Array.from(items).map(el => el.textContent.trim())
    }

    it('renders the DataTable with user data', async () => {
        render(<UsersPage />)

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument()
            expect(screen.getByText('Doe')).toBeInTheDocument()
        })
    })

    it('shows department-specific teams when entering row edit mode', async () => {
        const user = userEvent.setup()
        const { container } = render(<UsersPage />)

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument()
        })

        await enterEditMode(container, user)

        // Open teams MultiSelect
        await openMultiSelect(getCells(container)[COL.TEAMS], user)

        // Should show only Engineering teams (department_id: 1)
        const itemTexts = getMultiSelectItemTexts()
        expect(itemTexts).toContain('Frontend')
        expect(itemTexts).toContain('Backend')
        expect(itemTexts).not.toContain('Social Media')
        expect(itemTexts).not.toContain('Content')
    })

    it('clears teams and updates team options when department changes', async () => {
        const user = userEvent.setup()
        const { container } = render(<UsersPage />)

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument()
        })

        await enterEditMode(container, user)

        // ── Change department: Engineering → Marketing ──
        await selectDropdownOption(getCells(container)[COL.DEPARTMENT], user, 'Marketing')

        // ── Verify department input shows new value ──
        const deptInput = getCells(container)[COL.DEPARTMENT].querySelector('input[data-pc-section="input"]')
        expect(deptInput.value).toBe('Marketing')

        // ── Verify previous teams were cleared (no chips) ──
        await waitFor(() => {
            const multiselect = getCells(container)[COL.TEAMS].querySelector('.p-multiselect')
            const chips = multiselect.querySelectorAll('.p-multiselect-token')
            expect(chips.length).toBe(0)
        })

        // ── Verify team options now show Marketing teams ──
        // Wait for React to fully process the department and teams state updates
        await waitFor(async () => {
            // Close any stale panels first
            await user.keyboard('{Escape}')
            const ms = getCells(container)[COL.TEAMS].querySelector('.p-multiselect')
            await user.click(ms)

            const panel = document.querySelector('.p-multiselect-panel')
            const items = panel?.querySelectorAll('[data-pc-section="item"]') || []
            const texts = Array.from(items).map(el => el.textContent.trim())
            expect(texts).toContain('Social Media')
        })

        const itemTexts = getMultiSelectItemTexts()
        expect(itemTexts).toContain('Social Media')
        expect(itemTexts).toContain('Content')
        expect(itemTexts).not.toContain('Frontend')
        expect(itemTexts).not.toContain('Backend')
    })

    it('sends cleared team_ids when department changes and user saves immediately', async () => {
        const user = userEvent.setup()
        const { container } = render(<UsersPage />)

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument()
        })

        await enterEditMode(container, user)

        // Change department to Marketing (teams should auto-clear)
        await selectDropdownOption(getCells(container)[COL.DEPARTMENT], user, 'Marketing')

        // Save without selecting new teams
        const saveButton = container.querySelector('[data-pc-section="roweditorsavebutton"]')
        expect(saveButton).toBeTruthy()
        await user.click(saveButton)

        // updateUser should be called with Marketing department and empty team_ids
        await waitFor(() => {
            expect(mockUpdateUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 1,
                    department_id: 2,
                    team_ids: [], // previous teams cleared since they belonged to Engineering
                })
            )
        })
    })

    it('sends correct team_ids after department change and new team selection', async () => {
        const user = userEvent.setup()
        const { container } = render(<UsersPage />)

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument()
        })

        await enterEditMode(container, user)

        // Change department to Marketing
        await selectDropdownOption(getCells(container)[COL.DEPARTMENT], user, 'Marketing')

        // Wait for MultiSelect options to update to Marketing teams
        await waitFor(async () => {
            const ms = getCells(container)[COL.TEAMS].querySelector('.p-multiselect')
            await user.click(ms)
            const panel = document.querySelector('.p-multiselect-panel')
            const items = panel?.querySelectorAll('[data-pc-section="item"]') || []
            const texts = Array.from(items).map(el => el.textContent.trim())
            expect(texts).toContain('Social Media')
        })

        // Select "Social Media"
        const socialMediaItem = Array.from(
            document.querySelectorAll('.p-multiselect-panel [data-pc-section="item"]')
        ).find(el => el.textContent.trim() === 'Social Media')
        await user.click(socialMediaItem)

        // Close multiselect
        await user.keyboard('{Escape}')

        // Save the row edit
        const saveButton = container.querySelector('[data-pc-section="roweditorsavebutton"]')
        await user.click(saveButton)

        // updateUser should be called with Marketing department and Social Media team
        await waitFor(() => {
            expect(mockUpdateUser).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 1,
                    department_id: 2,
                    team_ids: [3], // Social Media team_id
                })
            )
        })
    })
})
