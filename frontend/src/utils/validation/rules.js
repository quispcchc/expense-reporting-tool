export const validationRules = {
    // Basic rules
    required: (value, message = 'This field is required') => {
        if (
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0)
        ) {
            return message
        }
        return null
    },

    minLength: (value, length, message = `Must be at least ${length} characters`) => {
        if (!value) return null // Skip if empty (use required rule separately)
        return value.length >= length ? null : message
    },

    maxLength: (value, length, message = `Must be no more than ${length} characters`) => {
        if (!value) return null
        return value.length <= length ? null : message
    },

    email: (value, message = 'Please enter a valid email address') => {
        if (!value) return null
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value) ? null : message
    },

    // Password-specific rules
    hasUppercase: (value, message = 'Password must contain at least one uppercase letter') => {
        if (!value) return null
        return /[A-Z]/.test(value) ? null : message
    },

    hasLowercase: (value, message = 'Password must contain at least one lowercase letter') => {
        if (!value) return null
        return /[a-z]/.test(value) ? null : message
    },

    hasNumber: (value, message = 'Password must contain at least one number') => {
        if (!value) return null
        return /\d/.test(value) ? null : message
    },

    hasSpecialChar: (value, message = 'Password must contain at least one special character') => {
        if (!value) return null
        return /[!@#$%^&*(),.?":{}|<>]/.test(value) ? null : message
    },

    // Field comparison rule
    matches: (value, formData, fieldName, message = `Must match ${fieldName}`) => {
        if (!value) return null
        return value === formData[fieldName] ? null : message
    },

    // Custom pattern rule
    pattern: (value, regex, message = 'Invalid format') => {
        if (!value) return null
        return regex.test(value) ? null : message
    },

}
