import { useState, useCallback } from 'react'
import { FilterMatchMode } from 'primereact/api'

export function useDataTableFilter() {
    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    const onGlobalFilterChange = useCallback((e) => {
        const value = e.target.value
        setFilters(prev => ({
            ...prev,
            global: { ...prev.global, value },
        }))
        setGlobalFilterValue(value)
    }, [])

    return { globalFilterValue, filters, onGlobalFilterChange }
}
