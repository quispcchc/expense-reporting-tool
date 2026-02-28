import { useState, useCallback } from 'react'
import { validateForm } from '../utils/validation/validator.js'

export function useMobileEditDialog({ validationSchema } = {}) {
    const [editDialog, setEditDialog] = useState(false)
    const [editData, setEditData] = useState(null)
    const [editErrors, setEditErrors] = useState({})

    const openDialog = useCallback((rowData) => {
        setEditData({ ...rowData })
        setEditErrors({})
        setEditDialog(true)
    }, [])

    const closeDialog = useCallback(() => {
        setEditDialog(false)
        setEditData(null)
        setEditErrors({})
    }, [])

    const updateField = useCallback((name, value) => {
        setEditData(prev => ({ ...prev, [name]: value }))
        setEditErrors(prev => ({ ...prev, [name]: undefined }))
    }, [])

    const validate = useCallback(() => {
        if (!editData || !validationSchema) return { isValid: true, errors: {} }
        const { isValid, errors } = validateForm(editData, validationSchema)
        if (!isValid) setEditErrors(errors)
        else setEditErrors({})
        return { isValid, errors }
    }, [editData, validationSchema])

    return {
        editDialog, editData, editErrors,
        openDialog, closeDialog, updateField, validate,
        setEditData, setEditErrors,
    }
}
