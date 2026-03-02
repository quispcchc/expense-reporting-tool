import { validateForm } from '../../../src/utils/validation/validator.js'
import { validationSchemas } from '../../../src/utils/validation/schemas.js'

const validMileage = {
    transaction_date: '2026-01-15',
    travel_from: 'Ottawa',
    travel_to: 'Toronto',
    distance_km: '50',
    parking_amount: '5.00',
    meter_km: '2.00',
    buyer: 'Test Buyer',
}

describe('mileage transaction schema validation', () => {
    // ==================== BASIC REQUIRED FIELDS ====================

    it('valid transaction passes all rules', () => {
        const result = validateForm(validMileage, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('missing transaction_date fails', () => {
        const result = validateForm({ ...validMileage, transaction_date: '' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.transaction_date).toBe('validation.transactionDateRequired')
    })

    it('missing travel_from fails', () => {
        const result = validateForm({ ...validMileage, travel_from: '' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.travel_from).toBe('validation.travelFromRequired')
    })

    it('missing travel_to fails', () => {
        const result = validateForm({ ...validMileage, travel_to: '' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.travel_to).toBe('validation.travelToRequired')
    })

    it('missing buyer fails', () => {
        const result = validateForm({ ...validMileage, buyer: '' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.buyer).toBe('validation.buyerRequired')
    })

    // ==================== NUMERIC VALIDATION ====================

    it('string distance_km "abc" fails with isNumeric message', () => {
        const result = validateForm({ ...validMileage, distance_km: 'abc' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.distance_km).toBe('validation.distanceNumeric')
    })

    it('negative distance_km fails', () => {
        const result = validateForm({ ...validMileage, distance_km: '-10' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.distance_km).toBe('validation.distanceNonNegative')
    })

    it('zero distance passes', () => {
        const result = validateForm({ ...validMileage, distance_km: '0' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(true)
    })

    it('parking_amount must be numeric if provided', () => {
        const result = validateForm({ ...validMileage, parking_amount: 'abc' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.parking_amount).toBe('validation.parkingNumeric')
    })

    it('negative parking_amount fails', () => {
        const result = validateForm({ ...validMileage, parking_amount: '-5' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.parking_amount).toBe('validation.parkingNonNegative')
    })

    it('meter_km must be numeric if provided', () => {
        const result = validateForm({ ...validMileage, meter_km: 'xyz' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.meter_km).toBe('validation.meterNumeric')
    })

    it('negative meter_km fails', () => {
        const result = validateForm({ ...validMileage, meter_km: '-3' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.meter_km).toBe('validation.meterNonNegative')
    })

    // ==================== METER MAX VALUE ====================

    it('meter_km greater than 5 fails', () => {
        const result = validateForm({ ...validMileage, meter_km: '6' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.meter_km).toBe('validation.meterMaxValue')
    })

    it('meter_km equal to 5 passes', () => {
        const result = validateForm({ ...validMileage, meter_km: '5' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(true)
    })

    it('meter_km of 4.99 passes', () => {
        const result = validateForm({ ...validMileage, meter_km: '4.99' }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(true)
    })

    // ==================== CONDITIONAL: DISTANCE / METER / PARKING ====================

    it('distance provided — meter and parking optional', () => {
        const result = validateForm({
            ...validMileage,
            distance_km: '100',
            meter_km: '',
            parking_amount: '',
        }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(true)
    })

    it('meter provided — distance and parking optional', () => {
        const result = validateForm({
            ...validMileage,
            distance_km: '',
            meter_km: '3',
            parking_amount: '',
        }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(true)
    })

    it('parking provided — distance and meter optional', () => {
        const result = validateForm({
            ...validMileage,
            distance_km: '',
            meter_km: '',
            parking_amount: '10',
        }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(true)
    })

    it('none of distance, meter, parking provided — all three show error', () => {
        const result = validateForm({
            ...validMileage,
            distance_km: '',
            meter_km: '',
            parking_amount: '',
        }, validationSchemas.mileageTransaction)
        expect(result.isValid).toBe(false)
        expect(result.errors.distance_km).toBe('validation.distanceMeterParkingRequired')
        expect(result.errors.meter_km).toBe('validation.distanceMeterParkingRequired')
        expect(result.errors.parking_amount).toBe('validation.distanceMeterParkingRequired')
    })

    it('all empty fields report all required errors', () => {
        const result = validateForm(
            { transaction_date: '', travel_from: '', travel_to: '', distance_km: '', parking_amount: '', meter_km: '', buyer: '' },
            validationSchemas.mileageTransaction,
        )
        expect(result.isValid).toBe(false)
        expect(result.errors.transaction_date).toBeDefined()
        expect(result.errors.travel_from).toBeDefined()
        expect(result.errors.travel_to).toBeDefined()
        expect(result.errors.distance_km).toBeDefined()
        expect(result.errors.parking_amount).toBeDefined()
        expect(result.errors.meter_km).toBeDefined()
        expect(result.errors.buyer).toBeDefined()
    })
})

describe('mileage header schema validation', () => {
    it('valid header with both dates passes', () => {
        const result = validateForm(
            { period_of_from: '2026-01-01', period_of_to: '2026-01-31' },
            validationSchemas.mileageHeader,
        )
        expect(result.isValid).toBe(true)
        expect(Object.keys(result.errors)).toHaveLength(0)
    })

    it('missing period_of_from fails', () => {
        const result = validateForm(
            { period_of_from: '', period_of_to: '2026-01-31' },
            validationSchemas.mileageHeader,
        )
        expect(result.isValid).toBe(false)
        expect(result.errors.period_of_from).toBe('validation.periodFromRequired')
    })

    it('missing period_of_to fails', () => {
        const result = validateForm(
            { period_of_from: '2026-01-01', period_of_to: '' },
            validationSchemas.mileageHeader,
        )
        expect(result.isValid).toBe(false)
        expect(result.errors.period_of_to).toBe('validation.periodToRequired')
    })

    it('both dates missing fails with both errors', () => {
        const result = validateForm(
            { period_of_from: '', period_of_to: '' },
            validationSchemas.mileageHeader,
        )
        expect(result.isValid).toBe(false)
        expect(result.errors.period_of_from).toBe('validation.periodFromRequired')
        expect(result.errors.period_of_to).toBe('validation.periodToRequired')
    })
})
