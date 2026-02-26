import { validateForm } from '../../../src/utils/validation/validator.js'
import { validationSchemas } from '../../../src/utils/validation/schemas.js'

const validExpense = {
    program: 1,
    transactionDate: '2026-01-15',
    costCentre: 1,
    vendor: 'Test Vendor',
    accountNum: 1,
    amount: '100',
    buyer: 'Test Buyer',
}

describe('expense schema validation', () => {
    it('valid expense passes all rules', () => {
        const result = validateForm(validExpense, validationSchemas.expense)
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('empty amount fails with required message', () => {
        const result = validateForm({ ...validExpense, amount: '' }, validationSchemas.expense)
        expect(result.isValid).toBe(false)
        expect(result.errors.amount).toBe('Amount is required')
    })

    it('string amount "abc" fails with isNumeric message', () => {
        const result = validateForm({ ...validExpense, amount: 'abc' }, validationSchemas.expense)
        expect(result.isValid).toBe(false)
        expect(result.errors.amount).toBe('Amount must be a number')
    })

    it('mixed string "12abc" fails with isNumeric message', () => {
        const result = validateForm({ ...validExpense, amount: '12abc' }, validationSchemas.expense)
        expect(result.isValid).toBe(false)
        expect(result.errors.amount).toBe('Amount must be a number')
    })

    it('zero amount passes', () => {
        const result = validateForm({ ...validExpense, amount: '0' }, validationSchemas.expense)
        expect(result.isValid).toBe(true)
    })

    it('decimal amount passes', () => {
        const result = validateForm({ ...validExpense, amount: '99.50' }, validationSchemas.expense)
        expect(result.isValid).toBe(true)
    })

    it('numeric type amount passes', () => {
        const result = validateForm({ ...validExpense, amount: 100 }, validationSchemas.expense)
        expect(result.isValid).toBe(true)
    })

    it('missing required fields reports errors', () => {
        const result = validateForm({}, validationSchemas.expense, { abortEarly: true })
        expect(result.isValid).toBe(false)
        expect(result.errors.program).toBe('Program is required')
        expect(result.errors.transactionDate).toBe('Transaction Date is required')
        expect(result.errors.costCentre).toBe('Cost Centre is required')
        expect(result.errors.vendor).toBe('Vendor is required')
        expect(result.errors.accountNum).toBe('Account Number is required')
        expect(result.errors.amount).toBe('Amount is required')
        expect(result.errors.buyer).toBe('Buyer is required')
    })

    it('whitespace-only amount fails with required message', () => {
        const result = validateForm({ ...validExpense, amount: '   ' }, validationSchemas.expense)
        expect(result.isValid).toBe(false)
        expect(result.errors.amount).toBe('Amount is required')
    })
})
