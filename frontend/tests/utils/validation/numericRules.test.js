import { validationRules } from '../../../src/utils/validation/rules.js'

describe('isNumeric', () => {
    const { isNumeric } = validationRules

    it('returns null for empty string (skip)', () => {
        expect(isNumeric('')).toBeNull()
    })

    it('returns null for undefined (skip)', () => {
        expect(isNumeric(undefined)).toBeNull()
    })

    it('returns null for null (skip)', () => {
        expect(isNumeric(null)).toBeNull()
    })

    it('returns null for valid integer string', () => {
        expect(isNumeric('123')).toBeNull()
    })

    it('returns null for valid decimal string', () => {
        expect(isNumeric('12.50')).toBeNull()
    })

    it('returns null for zero', () => {
        expect(isNumeric('0')).toBeNull()
    })

    it('returns null for negative number string', () => {
        expect(isNumeric('-5')).toBeNull()
    })

    it('returns null for numeric type', () => {
        expect(isNumeric(42)).toBeNull()
    })

    it('returns error for alphabetic string', () => {
        expect(isNumeric('abc')).toBe('Must be a valid number')
    })

    it('returns error for mixed string', () => {
        expect(isNumeric('12abc')).toBe('Must be a valid number')
    })

    it('returns error for whitespace', () => {
        expect(isNumeric('  ')).toBe('Must be a valid number')
    })

    it('returns custom error message', () => {
        expect(isNumeric('abc', 'Custom error')).toBe('Custom error')
    })
})

describe('minValue', () => {
    const { minValue } = validationRules

    it('returns null for empty string (skip)', () => {
        expect(minValue('', 0)).toBeNull()
    })

    it('returns null for undefined (skip)', () => {
        expect(minValue(undefined, 0)).toBeNull()
    })

    it('returns null for null (skip)', () => {
        expect(minValue(null, 0)).toBeNull()
    })

    it('returns null when value equals min', () => {
        expect(minValue('0', 0)).toBeNull()
    })

    it('returns null when value is above min', () => {
        expect(minValue('10', 0)).toBeNull()
    })

    it('returns error when value is below min', () => {
        expect(minValue('-1', 0)).toBe('Must be at least 0')
    })

    it('returns null for NaN input (let isNumeric handle it)', () => {
        expect(minValue('abc', 0)).toBeNull()
    })

    it('returns custom error message', () => {
        expect(minValue('-5', 0, 'No negatives')).toBe('No negatives')
    })

    it('works with numeric type values', () => {
        expect(minValue(5, 10)).toBe('Must be at least 10')
        expect(minValue(15, 10)).toBeNull()
    })
})

describe('requiredWithoutAll', () => {
    const { requiredWithoutAll } = validationRules

    it('returns null when at least one other field has a value', () => {
        const formData = { distance_km: '50', meter_km: '', parking_amount: '' }
        expect(requiredWithoutAll('', formData, ['distance_km', 'parking_amount'])).toBeNull()
    })

    it('returns error when all other fields are empty and this field is empty', () => {
        const formData = { distance_km: '', meter_km: '', parking_amount: '' }
        expect(requiredWithoutAll('', formData, ['distance_km', 'parking_amount'])).toBe('This field is required')
    })

    it('returns null when all other fields are empty but this field has a value', () => {
        const formData = { distance_km: '', meter_km: '3', parking_amount: '' }
        expect(requiredWithoutAll('3', formData, ['distance_km', 'parking_amount'])).toBeNull()
    })

    it('returns custom error message', () => {
        const formData = { a: '', b: '' }
        expect(requiredWithoutAll('', formData, ['a', 'b'], 'Need at least one')).toBe('Need at least one')
    })

    it('treats whitespace-only as empty', () => {
        const formData = { a: '  ', b: '' }
        expect(requiredWithoutAll('', formData, ['a', 'b'])).toBe('This field is required')
    })

    it('treats null/undefined other fields as empty', () => {
        const formData = { a: null, b: undefined }
        expect(requiredWithoutAll('', formData, ['a', 'b'])).toBe('This field is required')
    })
})

describe('maxValue', () => {
    const { maxValue } = validationRules

    it('returns null for empty string (skip)', () => {
        expect(maxValue('', 100)).toBeNull()
    })

    it('returns null for undefined (skip)', () => {
        expect(maxValue(undefined, 100)).toBeNull()
    })

    it('returns null when value equals max', () => {
        expect(maxValue('100', 100)).toBeNull()
    })

    it('returns null when value is below max', () => {
        expect(maxValue('50', 100)).toBeNull()
    })

    it('returns error when value exceeds max', () => {
        expect(maxValue('150', 100)).toBe('Must be no more than 100')
    })

    it('returns null for NaN input (let isNumeric handle it)', () => {
        expect(maxValue('abc', 100)).toBeNull()
    })

    it('returns custom error message', () => {
        expect(maxValue('200', 100, 'Too high')).toBe('Too high')
    })
})
