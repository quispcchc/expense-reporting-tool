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
        expect(result.errors.amount).toBe('validation.amountRequired')
    })

    it('string amount "abc" fails with isNumeric message', () => {
        const result = validateForm({ ...validExpense, amount: 'abc' }, validationSchemas.expense)
        expect(result.isValid).toBe(false)
        expect(result.errors.amount).toBe('validation.amountNumeric')
    })

    it('mixed string "12abc" fails with isNumeric message', () => {
        const result = validateForm({ ...validExpense, amount: '12abc' }, validationSchemas.expense)
        expect(result.isValid).toBe(false)
        expect(result.errors.amount).toBe('validation.amountNumeric')
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
        expect(result.errors.program).toBe('validation.programRequired')
        expect(result.errors.transactionDate).toBe('validation.transactionDateRequired')
        expect(result.errors.costCentre).toBe('validation.costCentreRequired')
        expect(result.errors.vendor).toBe('validation.vendorRequired')
        expect(result.errors.accountNum).toBe('validation.accountNumRequired')
        expect(result.errors.amount).toBe('validation.amountRequired')
        expect(result.errors.buyer).toBe('validation.buyerRequired')
    })

    it('whitespace-only amount fails with required message', () => {
        const result = validateForm({ ...validExpense, amount: '   ' }, validationSchemas.expense)
        expect(result.isValid).toBe(false)
        expect(result.errors.amount).toBe('validation.amountRequired')
    })
})
