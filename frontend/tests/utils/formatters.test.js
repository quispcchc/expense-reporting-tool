import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '../../src/utils/formatters.js'

describe('formatCurrency', () => {
    it('formats a positive number as USD', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('formats zero', () => {
        expect(formatCurrency(0)).toBe('$0.00')
    })

    it('formats null as $0.00', () => {
        expect(formatCurrency(null)).toBe('$0.00')
    })

    it('formats undefined as $0.00', () => {
        expect(formatCurrency(undefined)).toBe('$0.00')
    })

    it('formats negative numbers', () => {
        expect(formatCurrency(-50)).toBe('-$50.00')
    })

    it('formats string numbers', () => {
        expect(formatCurrency('99.99')).toBe('$99.99')
    })
})

describe('formatDate', () => {
    it('returns em-dash for null', () => {
        expect(formatDate(null)).toBe('—')
    })

    it('returns em-dash for undefined', () => {
        expect(formatDate(undefined)).toBe('—')
    })

    it('returns em-dash for empty string', () => {
        expect(formatDate('')).toBe('—')
    })

    it('extracts first 10 characters from ISO date string', () => {
        expect(formatDate('2025-07-15T14:30:00Z')).toBe('2025-07-15')
    })

    it('returns short date string as-is', () => {
        expect(formatDate('2025-07-15')).toBe('2025-07-15')
    })

    it('converts non-string to string', () => {
        expect(formatDate(12345)).toBe('12345')
    })
})
