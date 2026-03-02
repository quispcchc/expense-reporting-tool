import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'fs'

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

import MobileEditDialog from '../../../src/components/common/ui/MobileEditDialog.jsx'

describe('Button type="button" safety – prevent accidental form submission', () => {

    // ── Rendering tests: MobileEditDialog ──────────────────────────

    describe('MobileEditDialog', () => {
        it('Save and Cancel buttons have type="button"', () => {
            render(
                <MobileEditDialog visible={true} header="Edit" onHide={vi.fn()} onSave={vi.fn()}>
                    <p>Content</p>
                </MobileEditDialog>,
            )

            const saveBtn = screen.getByRole('button', { name: /save/i })
            const cancelBtn = screen.getByRole('button', { name: /cancel/i })

            expect(saveBtn).toHaveAttribute('type', 'button')
            expect(cancelBtn).toHaveAttribute('type', 'button')
        })

        it('clicking Save does not trigger parent form submission', async () => {
            const onSubmit = vi.fn((e) => e.preventDefault())
            const onSave = vi.fn()
            const user = userEvent.setup()

            render(
                <form onSubmit={onSubmit}>
                    <MobileEditDialog visible={true} header="Edit" onHide={vi.fn()} onSave={onSave}>
                        <p>Content</p>
                    </MobileEditDialog>
                </form>,
            )

            await user.click(screen.getByRole('button', { name: /save/i }))

            expect(onSave).toHaveBeenCalledTimes(1)
            expect(onSubmit).not.toHaveBeenCalled()
        })

        it('clicking Cancel does not trigger parent form submission', async () => {
            const onSubmit = vi.fn((e) => e.preventDefault())
            const onHide = vi.fn()
            const user = userEvent.setup()

            render(
                <form onSubmit={onSubmit}>
                    <MobileEditDialog visible={true} header="Edit" onHide={onHide} onSave={vi.fn()}>
                        <p>Content</p>
                    </MobileEditDialog>
                </form>,
            )

            await user.click(screen.getByRole('button', { name: /cancel/i }))

            expect(onHide).toHaveBeenCalledTimes(1)
            expect(onSubmit).not.toHaveBeenCalled()
        })
    })

    // ── Source scan: every PrimeReact <Button> must have type="button" ──
    //
    // These components are rendered inside CreateClaim's <form>, so any
    // PrimeReact <Button> without an explicit type="button" defaults to
    // type="submit" and will accidentally submit the claim form.

    const filesToScan = [
        {
            path: 'src/components/feature/claims/expansionTable/EditableExpansionTable.jsx',
            label: 'EditableExpansionTable',
        },
        {
            path: 'src/components/common/ui/MobileEditDialog.jsx',
            label: 'MobileEditDialog',
        },
        {
            path: 'src/components/feature/mileage/MileageMobileCard.jsx',
            label: 'MileageMobileCard',
        },
        {
            path: 'src/components/feature/mileage/MileageTransactionForm.jsx',
            label: 'MileageTransactionForm',
        },
        {
            path: 'src/components/feature/mileage/MileageTransactions.jsx',
            label: 'MileageTransactions',
        },
        {
            path: 'src/components/feature/mileage/MileageDataTable.jsx',
            label: 'MileageDataTable',
        },
        {
            path: 'src/components/feature/claims/AddExpenseForm.jsx',
            label: 'AddExpenseForm',
        },
    ]

    describe('source scan – all <Button> components must have type="button"', () => {
        filesToScan.forEach(({ path, label }) => {
            it(`${label}: every <Button> has type="button"`, () => {
                const content = readFileSync(path, 'utf-8')

                // Match each self-closing PrimeReact <Button ... /> tag (possibly multiline)
                // Uses \/> instead of > to avoid false matches on arrow functions (() =>)
                const buttonTags = content.match(/<Button\b[\s\S]*?\/>/g) || []

                // Sanity: file should contain at least one <Button>
                expect(buttonTags.length).toBeGreaterThan(0)

                const violations = buttonTags.filter((tag) => !tag.includes('type="button"'))

                expect(
                    violations,
                    `Found ${violations.length} <Button> without type="button" in ${label}:\n${violations.join('\n---\n')}`,
                ).toEqual([])
            })
        })
    })
})
