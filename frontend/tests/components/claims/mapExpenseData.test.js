import { describe, it, expect, vi } from 'vitest'
import mapExpenseData from '../../../src/utils/mapExpenseData.js'

// Mock the API_BASE_URL
vi.mock('../../../src/api/api.js', () => ({
    API_BASE_URL: 'http://localhost',
    default: {},
}))

describe('mapExpenseData', () => {
    it('returns empty array for null/undefined data', () => {
        expect(mapExpenseData(null, 'create')).toEqual([])
        expect(mapExpenseData(undefined, 'edit')).toEqual([])
    })

    it('returns empty array for unknown mode', () => {
        expect(mapExpenseData([{ id: 1 }], 'unknown')).toEqual([])
    })

    describe('create mode', () => {
        it('preserves existing transactionId', () => {
            const data = [{ transactionId: 42, vendor: 'Test' }]
            const result = mapExpenseData(data, 'create')
            expect(result[0].transactionId).toBe(42)
            expect(result[0].vendor).toBe('Test')
        })

        it('assigns incremental transactionId when missing', () => {
            const data = [{ vendor: 'A' }, { vendor: 'B' }]
            const result = mapExpenseData(data, 'create')
            expect(result[0].transactionId).toBe(1)
            expect(result[1].transactionId).toBe(2)
        })
    })

    describe('edit/view mode', () => {
        const backendExpense = {
            expense_id: 10,
            buyer_name: 'John',
            vendor_name: 'Acme',
            transaction_date: '2025-01-15',
            account_number_id: 3,
            cost_centre_id: 5,
            expense_amount: 100.50,
            transaction_desc: 'Office supplies',
            transaction_notes: 'Urgent',
            tags: [{ tag_id: 1, tag_name: 'supplies' }],
            approval_status_id: 1,
            project_id: 7,
            receipts: [
                { receipt_path: 'receipts/test.pdf', receipt_name: 'test.pdf', receipt_id: 99 },
            ],
        }

        it('maps backend fields to frontend fields', () => {
            const result = mapExpenseData([backendExpense], 'edit')
            expect(result).toHaveLength(1)
            const item = result[0]
            expect(item.transactionId).toBe(10)
            expect(item.buyer).toBe('John')
            expect(item.vendor).toBe('Acme')
            expect(item.transactionDate).toBe('2025-01-15')
            expect(item.accountNum).toBe(3)
            expect(item.costCentre).toBe(5)
            expect(item.amount).toBe(100.50)
            expect(item.description).toBe('Office supplies')
            expect(item.notes).toBe('Urgent')
            expect(item.status).toBe(1)
            expect(item.program).toBe(7)
        })

        it('maps receipts to attachment array with full URLs', () => {
            const result = mapExpenseData([backendExpense], 'view')
            expect(result[0].attachment).toEqual([
                { url: 'http://localhost/storage/receipts/test.pdf', name: 'test.pdf', receipt_id: 99 },
            ])
        })

        it('sets empty attachment when no receipts', () => {
            const noReceipts = { ...backendExpense, receipts: null }
            const result = mapExpenseData([noReceipts], 'edit')
            expect(result[0].attachment).toEqual([])
        })

        it('includes mileage when present', () => {
            const withMileage = { ...backendExpense, mileage: { mileage_id: 1, travel_from: 'A' } }
            const result = mapExpenseData([withMileage], 'edit')
            expect(result[0].mileage).toEqual({ mileage_id: 1, travel_from: 'A' })
        })

        it('omits mileage key when not present', () => {
            const result = mapExpenseData([backendExpense], 'edit')
            expect(result[0]).not.toHaveProperty('mileage')
        })

        it('generates temp transactionId when expense_id is missing', () => {
            const noId = { ...backendExpense, expense_id: null }
            const result = mapExpenseData([noId], 'edit')
            expect(result[0].transactionId).toMatch(/^temp-0-/)
        })
    })
})
