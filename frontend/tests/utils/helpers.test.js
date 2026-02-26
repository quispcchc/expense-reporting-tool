import { generateId, showToast, autoFillForm } from '../../src/utils/helpers.js'

describe('helpers', () => {
    // --- generateId ---
    describe('generateId', () => {
        it('returns a number', () => {
            expect(typeof generateId()).toBe('number')
        })

        it('returns a 6-digit number between 100000 and 999999', () => {
            // Run multiple times to increase confidence
            for (let i = 0; i < 50; i++) {
                const id = generateId()
                expect(id).toBeGreaterThanOrEqual(100000)
                expect(id).toBeLessThanOrEqual(999999)
            }
        })
    })

    // --- showToast ---
    describe('showToast', () => {
        it('calls toastRef.current.show with correct args', () => {
            const show = vi.fn()
            const toastRef = { current: { show } }

            showToast(toastRef, {
                severity: 'success',
                summary: 'Done',
                detail: 'It worked',
                life: 5000,
            })

            expect(show).toHaveBeenCalledOnce()
            expect(show).toHaveBeenCalledWith({
                severity: 'success',
                summary: 'Done',
                detail: 'It worked',
                life: 5000,
            })
        })

        it('does nothing when toastRef is null', () => {
            // Should not throw
            expect(() => {
                showToast(null, { severity: 'error', summary: 'Oops' })
            }).not.toThrow()
        })

        it('does nothing when toastRef.current is null', () => {
            const toastRef = { current: null }

            expect(() => {
                showToast(toastRef, { severity: 'warn', summary: 'Hmm' })
            }).not.toThrow()
        })
    })

    // --- autoFillForm ---
    describe('autoFillForm', () => {
        it('calls setFormData with the correct shape', () => {
            const setFormData = vi.fn()
            autoFillForm(setFormData)

            expect(setFormData).toHaveBeenCalledOnce()

            const formData = setFormData.mock.calls[0][0]
            expect(formData).toEqual(
                expect.objectContaining({
                    program: expect.any(Number),
                    transactionDate: expect.any(String),
                    costCentre: expect.any(Number),
                    vendor: expect.any(String),
                    accountNum: expect.any(Number),
                    amount: expect.any(Number),
                    buyer: expect.any(String),
                    description: expect.any(String),
                    notes: expect.any(String),
                }),
            )
        })

        it('includes expected default values', () => {
            const setFormData = vi.fn()
            autoFillForm(setFormData)

            const formData = setFormData.mock.calls[0][0]
            expect(formData.program).toBe(1)
            expect(formData.transactionDate).toBe('2025-07-01')
            expect(formData.costCentre).toBe(1)
            expect(formData.vendor).toBe('Food Basics')
            expect(formData.accountNum).toBe(1)
            expect(formData.amount).toBe(33)
            expect(formData.buyer).toBe('Shan')
            expect(formData.description).toBe('This is for test')
            expect(formData.notes).toBe('This is for test')
        })
    })
})
