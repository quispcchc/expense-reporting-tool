import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileEditDialog } from '../../src/hooks/useMobileEditDialog.js'

describe('useMobileEditDialog', () => {
    it('initializes with dialog closed and no data', () => {
        const { result } = renderHook(() => useMobileEditDialog())
        expect(result.current.editDialog).toBe(false)
        expect(result.current.editData).toBeNull()
        expect(result.current.editErrors).toEqual({})
    })

    it('opens dialog with row data copy', () => {
        const { result } = renderHook(() => useMobileEditDialog())
        const row = { id: 1, name: 'Test' }
        act(() => { result.current.openDialog(row) })
        expect(result.current.editDialog).toBe(true)
        expect(result.current.editData).toEqual({ id: 1, name: 'Test' })
        expect(result.current.editData).not.toBe(row)
    })

    it('closes dialog and clears state', () => {
        const { result } = renderHook(() => useMobileEditDialog())
        act(() => { result.current.openDialog({ id: 1 }) })
        act(() => { result.current.closeDialog() })
        expect(result.current.editDialog).toBe(false)
        expect(result.current.editData).toBeNull()
        expect(result.current.editErrors).toEqual({})
    })

    it('updates a field and clears its error', () => {
        const { result } = renderHook(() => useMobileEditDialog())
        act(() => { result.current.openDialog({ id: 1, name: '' }) })
        // Simulate a prior error
        act(() => { result.current.setEditErrors({ name: 'required' }) })
        expect(result.current.editErrors.name).toBe('required')
        act(() => { result.current.updateField('name', 'New') })
        expect(result.current.editData.name).toBe('New')
        expect(result.current.editErrors.name).toBeUndefined()
    })

    it('validates with schema and sets errors on failure', () => {
        const schema = { name: [{ rule: 'required', messageKey: 'validation.required' }] }
        const { result } = renderHook(() => useMobileEditDialog({ validationSchema: schema }))
        act(() => { result.current.openDialog({ name: '' }) })
        let validation
        act(() => { validation = result.current.validate() })
        expect(validation.isValid).toBe(false)
        expect(Object.keys(result.current.editErrors).length).toBeGreaterThan(0)
    })

    it('validates with schema and clears errors on success', () => {
        const schema = { name: [{ rule: 'required', messageKey: 'validation.required' }] }
        const { result } = renderHook(() => useMobileEditDialog({ validationSchema: schema }))
        act(() => { result.current.openDialog({ name: 'Valid' }) })
        let validation
        act(() => { validation = result.current.validate() })
        expect(validation.isValid).toBe(true)
        expect(result.current.editErrors).toEqual({})
    })

    it('validate returns valid when no schema provided', () => {
        const { result } = renderHook(() => useMobileEditDialog())
        act(() => { result.current.openDialog({ name: '' }) })
        let validation
        act(() => { validation = result.current.validate() })
        expect(validation.isValid).toBe(true)
    })
})
