import { useState, useMemo, useCallback } from 'react'
import { FilterMatchMode } from 'primereact/api'
import { APPROVAL_STATUS } from '../config/constants.js'

const INITIAL_FILTER_VALUES = {
    keyword: '',
    requestId: '',
    status: '',
    type: '',
    amountMin: null,
    amountMax: null,
    dateFrom: null,
    dateTo: null,
}

const INITIAL_FILTERS = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    claim_id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'claim_type.claim_type_name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    total_amount: { value: null, matchMode: FilterMatchMode.BETWEEN },
    claim_submitted: { value: null, matchMode: FilterMatchMode.BETWEEN },
    'status.claim_status_name': { value: null, matchMode: FilterMatchMode.EQUALS },
}

export function useClaimListFilters({ claims, claimStatus }) {
    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [filterValues, setFilterValues] = useState(INITIAL_FILTER_VALUES)
    const [filters, setFilters] = useState(INITIAL_FILTERS)

    // Derived values
    const pendingStatusName = claimStatus?.find(s => s.claim_status_id === APPROVAL_STATUS.PENDING)?.claim_status_name || 'Pending'
    const isPendingActive = filterValues.status === pendingStatusName

    const hasActiveFilters = filterValues.status || filterValues.type || filterValues.requestId ||
        filterValues.amountMin !== null || filterValues.amountMax !== null ||
        filterValues.dateFrom || filterValues.dateTo || globalFilterValue

    // Filtered claims for mobile view
    const filteredClaims = useMemo(() => {
        if (!claims) return []

        return claims.filter(claim => {
            const matchKeyword = !filterValues.keyword ||
                String(claim.claim_id).toLowerCase().includes(filterValues.keyword.toLowerCase()) ||
                claim.claim_type?.claim_type_name?.toLowerCase().includes(filterValues.keyword.toLowerCase())

            const matchRequestId = !filterValues.requestId ||
                String(claim.claim_id).includes(filterValues.requestId)

            const matchStatus = !filterValues.status ||
                claim.status?.claim_status_name === filterValues.status

            const matchType = !filterValues.type ||
                claim.claim_type?.claim_type_name === filterValues.type

            const matchAmountMin = !filterValues.amountMin ||
                claim.total_amount >= filterValues.amountMin

            const matchAmountMax = !filterValues.amountMax ||
                claim.total_amount <= filterValues.amountMax

            const matchDateFrom = !filterValues.dateFrom ||
                (claim.claim_submitted && claim.claim_submitted >= filterValues.dateFrom)

            const matchDateTo = !filterValues.dateTo ||
                (claim.claim_submitted && claim.claim_submitted <= filterValues.dateTo)

            return matchKeyword && matchRequestId && matchStatus && matchType &&
                matchAmountMin && matchAmountMax && matchDateFrom && matchDateTo
        })
    }, [claims, filterValues])

    // Handlers
    const onGlobalFilterChange = useCallback((e) => {
        const value = e.target.value
        setFilters(prev => ({ ...prev, global: { ...prev.global, value } }))
        setGlobalFilterValue(value)
    }, [])

    const togglePendingFilter = useCallback(() => {
        const newStatus = filterValues.status === pendingStatusName ? '' : pendingStatusName

        setFilterValues(prev => ({ ...prev, status: newStatus }))
        setFilters(prev => ({
            ...prev,
            'status.claim_status_name': { ...prev['status.claim_status_name'], value: newStatus || null },
        }))
    }, [filterValues.status, pendingStatusName])

    // Mobile filters apply via filteredClaims useMemo reactivity — just close the modal
    const applyMobileFilters = useCallback(() => {
        setShowFilterModal(false)
    }, [])

    const clearMobileFilters = useCallback(() => {
        setFilterValues(INITIAL_FILTER_VALUES)
        setShowFilterModal(false)
    }, [])

    const applyDesktopFilters = useCallback(() => {
        setFilters(prev => ({
            ...prev,
            'status.claim_status_name': { ...prev['status.claim_status_name'], value: filterValues.status || null },
            'claim_type.claim_type_name': { ...prev['claim_type.claim_type_name'], value: filterValues.type || null },
            'claim_id': { ...prev['claim_id'], value: filterValues.requestId || null },
            'total_amount': {
                ...prev['total_amount'],
                value: (filterValues.amountMin !== null || filterValues.amountMax !== null)
                    ? [filterValues.amountMin, filterValues.amountMax]
                    : null,
            },
            'claim_submitted': {
                ...prev['claim_submitted'],
                value: (filterValues.dateFrom || filterValues.dateTo)
                    ? [filterValues.dateFrom, filterValues.dateTo]
                    : null,
            },
        }))
        setShowFilterModal(false)
    }, [filterValues])

    const clearDesktopFilters = useCallback(() => {
        setFilterValues(INITIAL_FILTER_VALUES)
        setFilters(INITIAL_FILTERS)
        setGlobalFilterValue('')
        setShowFilterModal(false)
    }, [])

    return {
        globalFilterValue,
        onGlobalFilterChange,
        filters,
        filterValues,
        setFilterValues,
        filteredClaims,
        showFilterModal,
        setShowFilterModal,
        togglePendingFilter,
        applyMobileFilters,
        clearMobileFilters,
        applyDesktopFilters,
        clearDesktopFilters,
        hasActiveFilters,
        isPendingActive,
    }
}
