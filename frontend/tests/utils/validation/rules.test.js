import { validationRules } from '../../../src/utils/validation/rules.js'

describe('validationRules', () => {
  // --- required ---
  describe('required', () => {
    it('returns error for undefined', () => {
      expect(validationRules.required(undefined)).toBe('This field is required')
    })

    it('returns error for null', () => {
      expect(validationRules.required(null)).toBe('This field is required')
    })

    it('returns error for empty string', () => {
      expect(validationRules.required('')).toBe('This field is required')
    })

    it('returns error for whitespace-only string', () => {
      expect(validationRules.required('   ')).toBe('This field is required')
    })

    it('returns error for empty array', () => {
      expect(validationRules.required([])).toBe('This field is required')
    })

    it('returns null for a non-empty string', () => {
      expect(validationRules.required('hello')).toBeNull()
    })

    it('returns null for a non-empty array', () => {
      expect(validationRules.required([1])).toBeNull()
    })

    it('uses a custom message when provided', () => {
      expect(validationRules.required('', 'Name is required')).toBe('Name is required')
    })
  })

  // --- minLength ---
  describe('minLength', () => {
    it('returns null when value is empty (skip validation)', () => {
      expect(validationRules.minLength('', 3)).toBeNull()
    })

    it('returns error when value is shorter than the minimum', () => {
      expect(validationRules.minLength('ab', 3)).toBe('Must be at least 3 characters')
    })

    it('returns null when value meets the minimum length', () => {
      expect(validationRules.minLength('abc', 3)).toBeNull()
    })

    it('returns null when value exceeds the minimum length', () => {
      expect(validationRules.minLength('abcd', 3)).toBeNull()
    })
  })

  // --- maxLength ---
  describe('maxLength', () => {
    it('returns null when value is empty (skip validation)', () => {
      expect(validationRules.maxLength('', 5)).toBeNull()
    })

    it('returns null when value is within the maximum length', () => {
      expect(validationRules.maxLength('abc', 5)).toBeNull()
    })

    it('returns null when value is exactly the maximum length', () => {
      expect(validationRules.maxLength('abcde', 5)).toBeNull()
    })

    it('returns error when value exceeds the maximum length', () => {
      expect(validationRules.maxLength('abcdef', 5)).toBe('Must be no more than 5 characters')
    })
  })

  // --- email ---
  describe('email', () => {
    it('returns null when value is empty (skip validation)', () => {
      expect(validationRules.email('')).toBeNull()
    })

    it('returns null for a valid email', () => {
      expect(validationRules.email('user@example.com')).toBeNull()
    })

    it('returns error for an email missing the @ symbol', () => {
      expect(validationRules.email('userexample.com')).toBe('Please enter a valid email address')
    })

    it('returns error for an email missing the domain', () => {
      expect(validationRules.email('user@')).toBe('Please enter a valid email address')
    })

    it('returns error for an email with spaces', () => {
      expect(validationRules.email('user @example.com')).toBe('Please enter a valid email address')
    })
  })

  // --- hasUppercase ---
  describe('hasUppercase', () => {
    it('returns null when value is empty', () => {
      expect(validationRules.hasUppercase('')).toBeNull()
    })

    it('returns null when value contains an uppercase letter', () => {
      expect(validationRules.hasUppercase('abcDef')).toBeNull()
    })

    it('returns error when value has no uppercase letters', () => {
      expect(validationRules.hasUppercase('abcdef')).toBe(
        'Password must contain at least one uppercase letter',
      )
    })
  })

  // --- hasLowercase ---
  describe('hasLowercase', () => {
    it('returns null when value is empty', () => {
      expect(validationRules.hasLowercase('')).toBeNull()
    })

    it('returns null when value contains a lowercase letter', () => {
      expect(validationRules.hasLowercase('ABCdEF')).toBeNull()
    })

    it('returns error when value has no lowercase letters', () => {
      expect(validationRules.hasLowercase('ABCDEF')).toBe(
        'Password must contain at least one lowercase letter',
      )
    })
  })

  // --- hasNumber ---
  describe('hasNumber', () => {
    it('returns null when value is empty', () => {
      expect(validationRules.hasNumber('')).toBeNull()
    })

    it('returns null when value contains a digit', () => {
      expect(validationRules.hasNumber('abc1')).toBeNull()
    })

    it('returns error when value has no digits', () => {
      expect(validationRules.hasNumber('abcdef')).toBe(
        'Password must contain at least one number',
      )
    })
  })

  // --- hasSpecialChar ---
  describe('hasSpecialChar', () => {
    it('returns null when value is empty', () => {
      expect(validationRules.hasSpecialChar('')).toBeNull()
    })

    it('returns null when value contains a special character', () => {
      expect(validationRules.hasSpecialChar('abc!')).toBeNull()
    })

    it('returns error when value has no special characters', () => {
      expect(validationRules.hasSpecialChar('abcdef')).toBe(
        'Password must contain at least one special character',
      )
    })
  })

  // --- matches ---
  describe('matches', () => {
    it('returns null when value is empty (skip validation)', () => {
      expect(validationRules.matches('', { password: 'secret' }, 'password')).toBeNull()
    })

    it('returns null when value matches the target field', () => {
      expect(validationRules.matches('secret', { password: 'secret' }, 'password')).toBeNull()
    })

    it('returns error when value does not match the target field', () => {
      expect(validationRules.matches('other', { password: 'secret' }, 'password')).toBe(
        'Must match password',
      )
    })

    it('uses a custom message when provided', () => {
      expect(
        validationRules.matches('other', { password: 'secret' }, 'password', 'Passwords must match'),
      ).toBe('Passwords must match')
    })
  })

  // --- pattern ---
  describe('pattern', () => {
    it('returns null when value is empty (skip validation)', () => {
      expect(validationRules.pattern('', /^\d+$/)).toBeNull()
    })

    it('returns null when value matches the pattern', () => {
      expect(validationRules.pattern('12345', /^\d+$/)).toBeNull()
    })

    it('returns error when value does not match the pattern', () => {
      expect(validationRules.pattern('abc', /^\d+$/, 'Must be numeric')).toBe('Must be numeric')
    })

    it('uses the default message when none is provided', () => {
      expect(validationRules.pattern('abc', /^\d+$/)).toBe('Invalid format')
    })
  })
})
