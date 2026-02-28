import { validateForm } from '../../../src/utils/validation/validator.js'

describe('validateForm', () => {
    it('returns { isValid, errors, warnings, formData } shape', () => {
        const result = validateForm({}, {})
        expect(result).toHaveProperty('isValid')
        expect(result).toHaveProperty('errors')
        expect(result).toHaveProperty('warnings')
        expect(result).toHaveProperty('formData')
    })

    it('returns isValid true when all rules pass', () => {
        const schema = {
            email: [{ rule: 'required', message: 'Required' }],
        }
        const formData = { email: 'test@example.com' }
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual({})
    })

    it('returns isValid false with errors when a rule fails', () => {
        const schema = {
            email: [{ rule: 'required', message: 'Email is required' }],
        }
        const formData = { email: '' }
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(false)
        expect(result.errors.email).toBe('Email is required')
    })

    it('returns the original formData in the result', () => {
        const formData = { name: 'Alice' }
        const result = validateForm(formData, {})
        expect(result.formData).toBe(formData)
    })

    it('abortEarly (default true) stops at first error per field', () => {
        const schema = {
            password: [
                { rule: 'required', message: 'Password is required' },
                { rule: 'minLength', params: [8], message: 'Too short' },
            ],
        }
        const formData = { password: '' }
        const result = validateForm(formData, schema)
        // abortEarly=true stores a single string, not an array
        expect(result.errors.password).toBe('Password is required')
    })

    it('abortEarly false collects all errors per field as an array', () => {
        const schema = {
            password: [
                { rule: 'required', message: 'Password is required' },
                { rule: 'minLength', params: [8], message: 'Too short' },
            ],
        }
        const formData = { password: '' }
        const result = validateForm(formData, schema, { abortEarly: false })
        expect(Array.isArray(result.errors.password)).toBe(true)
        expect(result.errors.password).toContain('Password is required')
    })

    it('skipEmpty skips validation for non-required empty fields', () => {
        const schema = {
            nickname: [
                { rule: 'minLength', params: [3], message: 'Too short' },
            ],
        }
        const formData = { nickname: '' }
        const result = validateForm(formData, schema, { skipEmpty: true })
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual({})
    })

    it('skipEmpty still validates empty fields that have a required rule', () => {
        const schema = {
            nickname: [
                { rule: 'required', message: 'Nickname is required' },
                { rule: 'minLength', params: [3], message: 'Too short' },
            ],
        }
        const formData = { nickname: '' }
        const result = validateForm(formData, schema, { skipEmpty: true })
        expect(result.isValid).toBe(false)
        expect(result.errors.nickname).toBe('Nickname is required')
    })

    it('handles warning rules separately from errors', () => {
        const schema = {
            password: [
                { rule: 'minLength', params: [12], message: 'Consider a longer password', warning: true },
            ],
        }
        const formData = { password: 'short' }
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(true)
        expect(result.errors).toEqual({})
        expect(result.warnings.password).toContain('Consider a longer password')
    })

    it('handles the matches rule with special formData parameter', () => {
        const schema = {
            repeatPassword: [
                { rule: 'matches', params: ['password'], message: 'Passwords must match' },
            ],
        }
        const formData = { password: 'secret123', repeatPassword: 'different' }
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(false)
        expect(result.errors.repeatPassword).toBe('Passwords must match')
    })

    it('matches rule passes when fields are equal', () => {
        const schema = {
            repeatPassword: [
                { rule: 'matches', params: ['password'], message: 'Passwords must match' },
            ],
        }
        const formData = { password: 'secret123', repeatPassword: 'secret123' }
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(true)
    })

    it('handles params-based rules like minLength', () => {
        const schema = {
            name: [
                { rule: 'minLength', params: [5], message: 'Name too short' },
            ],
        }
        const formData = { name: 'Al' }
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(false)
        expect(result.errors.name).toBe('Name too short')
    })

    it('logs console.warn and continues for unknown rules', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const schema = {
            field: [
                { rule: 'nonExistentRule', message: 'Should not appear' },
            ],
        }
        const formData = { field: 'value' }
        const result = validateForm(formData, schema)
        expect(warnSpy).toHaveBeenCalledWith('Unknown validation rule: nonExistentRule')
        expect(result.isValid).toBe(true)
        warnSpy.mockRestore()
    })

    it('pushes "Validation error occurred" when a rule throws an exception', () => {
        // We simulate an exception by providing params that cause a thrown error.
        // The pattern rule expects a regex; passing a non-regex that triggers .test() to throw.
        const schema = {
            field: [
                { rule: 'pattern', params: [null], message: 'Bad pattern' },
            ],
        }
        const formData = { field: 'something' }
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(false)
        expect(result.errors.field).toBe('Validation error occurred')
        errorSpy.mockRestore()
    })

    it('validates multiple fields independently', () => {
        const schema = {
            email: [{ rule: 'required', message: 'Email is required' }],
            password: [{ rule: 'required', message: 'Password is required' }],
        }
        const formData = { email: '', password: '' }
        const result = validateForm(formData, schema)
        expect(result.isValid).toBe(false)
        expect(result.errors.email).toBe('Email is required')
        expect(result.errors.password).toBe('Password is required')
    })
})
