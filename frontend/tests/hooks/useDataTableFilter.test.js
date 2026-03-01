import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataTableFilter } from '../../src/hooks/useDataTableFilter.js'

describe('useDataTableFilter', () => {
    it('initializes with empty filter value', () => {
        const { result } = renderHook(() => useDataTableFilter())
        expect(result.current.globalFilterValue).toBe('')
        expect(result.current.filters.global.value).toBeNull()
    })

    it('updates filter value on change', () => {
        const { result } = renderHook(() => useDataTableFilter())
        act(() => {
            result.current.onGlobalFilterChange({ target: { value: 'test' } })
        })
        expect(result.current.globalFilterValue).toBe('test')
        expect(result.current.filters.global.value).toBe('test')
    })

    it('clears filter value', () => {
        const { result } = renderHook(() => useDataTableFilter())
        act(() => {
            result.current.onGlobalFilterChange({ target: { value: 'test' } })
        })
        act(() => {
            result.current.onGlobalFilterChange({ target: { value: '' } })
        })
        expect(result.current.globalFilterValue).toBe('')
        expect(result.current.filters.global.value).toBe('')
    })
})
