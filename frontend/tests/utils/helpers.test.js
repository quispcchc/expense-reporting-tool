import { generateId, showToast } from '../../src/utils/helpers.js'

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
})
