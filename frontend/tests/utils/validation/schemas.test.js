import { validationSchemas } from '../../../src/utils/validation/schemas.js'
import { validateForm } from '../../../src/utils/validation/validator.js'

describe('validationSchemas', () => {
    it('login schema has email and password fields', () => {
        expect(Object.keys(validationSchemas.login)).toEqual(['email', 'password'])
    })

    it('forgotPassword schema has email field', () => {
        expect(Object.keys(validationSchemas.forgotPassword)).toEqual(['email'])
    })

    it('resetPassword schema has password and repeatPassword fields', () => {
        expect(Object.keys(validationSchemas.resetPassword)).toEqual(['password', 'repeatPassword'])
    })

    it('updatePassword schema has current_password, new_password, and new_password_confirmation fields', () => {
        expect(Object.keys(validationSchemas.updatePassword)).toEqual([
            'current_password',
            'new_password',
            'new_password_confirmation',
        ])
    })

    it('claim schema has employeeName, position, department, team, and claimType fields', () => {
        expect(Object.keys(validationSchemas.claim)).toEqual([
            'employeeName',
            'position',
            'department',
            'team',
            'claimType',
        ])
    })

    it('expense schema has program, transactionDate, costCentre, vendor, accountNum, amount, and buyer fields', () => {
        expect(Object.keys(validationSchemas.expense)).toEqual([
            'program',
            'transactionDate',
            'costCentre',
            'vendor',
            'accountNum',
            'amount',
            'buyer',
        ])
    })

    it('addUser schema has first_name, last_name, email, department, teams, position, and role fields', () => {
        expect(Object.keys(validationSchemas.addUser)).toEqual([
            'first_name',
            'last_name',
            'email',
            'department',
            'teams',
            'position',
            'role',
        ])
    })

    it('addTeam schema has code, name, and status fields', () => {
        expect(Object.keys(validationSchemas.addTeam)).toEqual(['code', 'name', 'status'])
    })

    it('addCostCentre schema has department, code, and description fields', () => {
        expect(Object.keys(validationSchemas.addCostCentre)).toEqual(['department', 'code', 'description'])
    })

    it('addAccountNumber schema has accountNumber and description fields', () => {
        expect(Object.keys(validationSchemas.addAccountNumber)).toEqual(['accountNumber', 'description'])
    })
})

describe('validationSchemas integration with validateForm', () => {
    it('login schema fails validation with empty form data', () => {
        const formData = { email: '', password: '' }
        const result = validateForm(formData, validationSchemas.login)
        expect(result.isValid).toBe(false)
        expect(result.errors.email).toBeDefined()
        expect(result.errors.password).toBeDefined()
    })

    it('login schema passes validation with valid form data', () => {
        const formData = { email: 'user@example.com', password: 'password123' }
        const result = validateForm(formData, validationSchemas.login)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual({})
    })

    it('resetPassword schema validates password matching via matches rule', () => {
        const formData = { password: 'longpassword', repeatPassword: 'different' }
        const result = validateForm(formData, validationSchemas.resetPassword)
        expect(result.isValid).toBe(false)
        expect(result.errors.repeatPassword).toBe('Passwords must match')
    })

    it('resetPassword schema enforces minLength on password', () => {
        const formData = { password: 'short', repeatPassword: 'short' }
        const result = validateForm(formData, validationSchemas.resetPassword)
        expect(result.isValid).toBe(false)
        expect(result.errors.password).toBe('Password must be at least 8 characters long')
    })

    it('claim schema passes with all required fields filled', () => {
        const formData = {
            employeeName: 'Jane Doe',
            position: 'Volunteer',
            department: 'Finance',
            team: 'Team A',
            claimType: 'Expense',
        }
        const result = validateForm(formData, validationSchemas.claim)
        expect(result.isValid).toBe(true)
    })
})
