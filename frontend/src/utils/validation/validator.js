import { validationRules } from './rules'

export const validateForm = (formData, schema, options = {}) => {
    const { abortEarly = true, skipEmpty = false } = options
    const errors = {}
    const warnings = {}

    // Validate each field in the schema
    Object.keys(schema).forEach(fieldName => {
        const fieldRules = schema[fieldName]
        const fieldValue = formData[fieldName]
        const fieldErrors = []

        // Skip empty fields if skipEmpty is true (except required validation)
        if (skipEmpty && (!fieldValue || fieldValue === '')) {
            const hasRequiredRule = fieldRules.some(rule => rule.rule === 'required')
            if (!hasRequiredRule) return
        }

        // Run each validation rule for this field
        fieldRules.forEach(ruleConfig => {
            const { rule, params = [], message, warning = false } = ruleConfig
            const validator = validationRules[rule]

            if (!validator) {
                console.warn(`Unknown validation rule: ${rule}`)
                return
            }

            let result = null

            try {
                // Execute validation based on rule type
                if (rule === 'matches') {
                    result = validator(fieldValue, formData, params[0], message)
                } else if (params.length > 0) {
                    result = validator(fieldValue, ...params, message)
                } else {
                    result = validator(fieldValue, message)
                }

                if (result) {
                    if (warning) {
                        if (!warnings[fieldName]) warnings[fieldName] = []
                        warnings[fieldName].push(result)
                    } else {
                        fieldErrors.push(result)
                        if (abortEarly) return // Stop at first error for this field
                    }
                }
            } catch (error) {
                console.error(`Validation error for field ${fieldName}, rule ${rule}:`, error)
                fieldErrors.push('Validation error occurred')
            }
        })

        // Store errors for this field
        if (fieldErrors.length > 0) {
            errors[fieldName] = abortEarly ? fieldErrors[0] : fieldErrors
        }
    })

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings,
        formData
    }
}

