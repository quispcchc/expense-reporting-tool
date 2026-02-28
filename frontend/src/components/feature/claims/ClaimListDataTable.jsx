import React, { useEffect, useState, useMemo, useRef } from 'react'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import AmountRangeFilter from '../../common/ui/AmountRangeFilter.jsx'
import DateRangeFilter from '../../common/ui/DateRangeFilter.jsx'
import { FilterMatchMode } from 'primereact/api'
import StatusTab from '../../common/ui/StatusTab.jsx'
import { Link } from 'react-router-dom'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { Calendar } from 'primereact/calendar'
import { InputNumber } from 'primereact/inputnumber'
import { BUTTON_STYLE, STATUS_STYLES } from '../../../utils/customizeStyle.js'
import { showToast } from '../../../utils/helpers.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useClaims } from '../../../contexts/ClaimContext.jsx'
import api from '../../../api/api.js'
import { confirmDialog } from 'primereact/confirmdialog'
import { useIsMobile } from '../../../hooks/useIsMobile.js'
import { useTranslation } from 'react-i18next'

// Status color mapping for cards
const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Draft': 'bg-gray-100 text-gray-800',
}

function ClaimListDataTable({ claims, user, path, toastRef }) {
    const { t } = useTranslation()
    const { fetchClaims, fetchMyClaims } = useClaims()
    const isMobile = useIsMobile()

    useEffect(() => {
        const fetchData = async () => {
            if (user === 'admin') {
                await fetchClaims()
            } else {
                await fetchMyClaims()
            }
        }
        fetchData()
    }, [user])

    const { lookups: { claimStatus, claimTypes } } = useLookups()

    // State for global filter input and DataTable filters
    const [globalFilterValue, setGlobalFilterValue] = useState('')

    const [selectedClaims, setSelectedClaims] = useState([])
    const isDisabled = !selectedClaims || selectedClaims.length === 0;
    const [isExporting, setIsExporting] = useState(false)
    const abortControllerRef = useRef(null)

    // Filter modal state (shared for mobile and desktop)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [filterValues, setFilterValues] = useState({
        keyword: '',
        requestId: '',
        status: '',
        type: '',
        amountMin: null,
        amountMax: null,
        dateFrom: null,
        dateTo: null
    })

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        claim_id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'claim_type.claim_type_name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        total_amount: { value: null, matchMode: FilterMatchMode.BETWEEN },
        claim_submitted: { value: null, matchMode: FilterMatchMode.BETWEEN },
        'status.claim_status_name': { value: null, matchMode: FilterMatchMode.EQUALS },
    })

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

            return matchKeyword && matchRequestId && matchStatus && matchType && matchAmountMin && matchAmountMax
        })
    }, [claims, filterValues])

    // Handle global search input changes
    const onGlobalFilterChange = (e) => {
        const value = e.target.value
        let _filters = { ...filters }

        _filters['global'].value = value

        setFilters(_filters)
        setGlobalFilterValue(value)
    }

    // Column Render Template
    const statusBodyTemplate = (rowData) => (
        <StatusTab status={rowData.claim_status_id} />
    )

    const totalAmountBodyTemplate = (rowData) => (
        <>${rowData.total_amount}</>
    )

    const statusItemTemplate = (option) => {
        return <div
            className={`rounded-lg p-1 text-center text-sm font-medium w-21 ${STATUS_STYLES[option.value]}`}>
            {option.value}
        </div>

    }

    // Filter Template
    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown value={options.value} options={claimStatus.map(
                opt => ({ label: opt.claim_status_name, value: opt.claim_status_name }))}
                onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={statusItemTemplate}
                placeholder={t('filter.select', 'Select')} className="p-column-filter min-w-5" showClear />
        )
    }

    const togglePendingFilter = () => {
        const pendingStatusName = claimStatus?.find(s => s.claim_status_id === 1)?.claim_status_name || 'Pending'
        const isPendingActive = filterValues.status === pendingStatusName

        const newStatus = isPendingActive ? '' : pendingStatusName

        setFilterValues(prev => ({ ...prev, status: newStatus }))

        let _filters = { ...filters }
        _filters['status.claim_status_name'].value = newStatus || null
        setFilters(_filters)
    }

    const claimTypeFilterTemplate = (options) => (
        <Dropdown value={options.value}
            options={claimTypes.map(opt => ({ label: opt.claim_type_name, value: opt.claim_type_name }))}
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder={t('filter.selectOne', 'Select One')} className="p-column-filter" />
    )

    const customTextFilter = (options) => {
        return (
            <InputText
                value={options.value || ''}
                onChange={(e) => options.filterApplyCallback(e.target.value)}
                placeholder={t('common.search', 'Search')}
                className="p-column-filter min-w-30"
            />
        )
    }

    const actionBodyTemplate = (rowData) => (
        <>
            {user === 'admin' ?
                <Link to={`${rowData.claim_id}/edit-claim`}>
                    <button className="pi pi-pencil cursor-pointer"></button>
                </Link> : <Link to={`${rowData.claim_id}/view-claim`}>
                    <button className="pi pi-eye cursor-pointer"></button>
                </Link>}

        </>
    )

    function bulkApproveClaim() {
        const claimIds = selectedClaims.map(claim => claim.claim_id)
        const payload = { claimIds }

        confirmDialog({
            message: t('claims.bulkApproveMessage', 'Do you want to approve all selected claims?'),
            header: t('claims.bulkApproveHeader', 'Bulk Approve Confirmation'),
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-info',
            accept: async () => {
                try {
                    await api.post('claims/bulk-approve', payload)
                    if (user === 'admin') {
                        await fetchClaims(true)
                    } else {
                        await fetchMyClaims(true)
                    }
                    showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t('claims.bulkApproveSuccess', 'Selected claims has been approved successfully!') })
                }
                catch (error) {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error', 'Error'), detail: error.message })
                }
            },
            reject: () => { return showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t('claims.bulkApproveCancelled', 'Bulk Approve Cancelled') }) },
        })

        setSelectedClaims([])

    }

    function bulkRejectClaim() {
        const claimIds = selectedClaims.map(claim => claim.claim_id)
        const payload = { claimIds }

        confirmDialog({
            message: t('claims.bulkRejectMessage', 'Do you want to reject all selected claims?'),
            header: t('claims.bulkRejectHeader', 'Bulk Reject Confirmation'),
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-info',
            accept: async () => {
                try {
                    await api.post('claims/bulk-reject', payload)
                    if (user === 'admin') {
                        await fetchClaims(true)
                    } else {
                        await fetchMyClaims(true)
                    }
                    showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t('claims.bulkRejectSuccess', 'Selected claims has been rejected successfully!') })
                }
                catch (error) {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error', 'Error'), detail: error.message })
                }
            },
            reject: () => { return showToast(toastRef, { severity: 'info', summary: t('toast.cancel', 'Cancel'), detail: t('claims.bulkRejectCancelled', 'Bulk Reject Cancelled') }) },
        })

        setSelectedClaims([])


    }

    async function handleExportPdf() {
        if (!selectedClaims || selectedClaims.length === 0) {
            showToast(toastRef, {
                severity: 'warn',
                summary: t('toast.warning'),
                detail: t('claims.exportSelectWarning')
            })
            return
        }

        // Cancel any previous ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        setIsExporting(true)

        try {
            // Single claim - direct PDF download
            if (selectedClaims.length === 1) {
                const claimId = selectedClaims[0].claim_id
                const response = await api.get(`/claims/${claimId}/export-pdf`, {
                    responseType: 'blob',
                    signal,
                })

                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `claim_${claimId}_${new Date().toISOString().split('T')[0]}.pdf`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)

                showToast(toastRef, {
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('claims.exportSuccess')
                })
            }
            // Multiple claims - ZIP download
            else {
                const claimIds = selectedClaims.map(claim => claim.claim_id)
                const response = await api.post('/claims/export-multiple-pdf',
                    { claimIds },
                    { responseType: 'blob', signal }
                )

                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `claims_export_${new Date().toISOString().split('T')[0]}.zip`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)

                showToast(toastRef, {
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('claims.exportZipSuccess', { count: selectedClaims.length })
                })
            }
        } catch (error) {
            // Ignore aborted requests
            if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
                return
            }

            let errorDetail = t('claims.exportFailed');

            if (error?.message) {
                errorDetail = error.message;
            } else if (error?.response?.status === 500) {
                errorDetail = t('claims.exportServerError');
            } else if (error?.response?.status === 408) {
                errorDetail = t('claims.exportTimeout');
            }

            showToast(toastRef, {
                severity: 'error',
                summary: t('common.error'),
                detail: errorDetail
            })
        } finally {
            setIsExporting(false)
            abortControllerRef.current = null
        }
    }

    // Toggle claim selection for mobile
    const toggleClaimSelection = (claim) => {
        const isSelected = selectedClaims.some(c => c.claim_id === claim.claim_id)
        if (isSelected) {
            setSelectedClaims(selectedClaims.filter(c => c.claim_id !== claim.claim_id))
        } else {
            setSelectedClaims([...selectedClaims, claim])
        }
    }

    // Apply mobile filters
    const applyMobileFilters = () => {
        setShowFilterModal(false)
    }

    // Clear mobile filters
    const clearMobileFilters = () => {
        setFilterValues({ keyword: '', requestId: '', status: '', type: '', amountMin: null, amountMax: null, dateFrom: null, dateTo: null })
        setShowFilterModal(false)
    }

    // Apply desktop filters from overlay
    const applyDesktopFilters = () => {
        let _filters = { ...filters }

        _filters['status.claim_status_name'].value = filterValues.status || null
        _filters['claim_type.claim_type_name'].value = filterValues.type || null
        _filters['claim_id'].value = filterValues.requestId || null

        // Amount range filter
        if (filterValues.amountMin !== null || filterValues.amountMax !== null) {
            _filters['total_amount'].value = [filterValues.amountMin, filterValues.amountMax]
        } else {
            _filters['total_amount'].value = null
        }

        // Date range filter
        if (filterValues.dateFrom || filterValues.dateTo) {
            _filters['claim_submitted'].value = [filterValues.dateFrom, filterValues.dateTo]
        } else {
            _filters['claim_submitted'].value = null
        }

        setFilters(_filters)
        setShowFilterModal(false)
    }

    // Clear desktop filters
    const clearDesktopFilters = () => {
        setFilterValues({ keyword: '', requestId: '', status: '', type: '', amountMin: null, amountMax: null, dateFrom: null, dateTo: null })
        let _filters = { ...filters }
        _filters['status.claim_status_name'].value = null
        _filters['claim_type.claim_type_name'].value = null
        _filters['claim_id'].value = null
        _filters['total_amount'].value = null
        _filters['claim_submitted'].value = null
        _filters['global'].value = null
        setFilters(_filters)
        setGlobalFilterValue('')
        setShowFilterModal(false)
    }

    // Check if any filter is active
    const hasActiveFilters = filterValues.status || filterValues.type || filterValues.requestId ||
        filterValues.amountMin !== null || filterValues.amountMax !== null ||
        filterValues.dateFrom || filterValues.dateTo || globalFilterValue

    // ============================================
    // DESKTOP FILTER OVERLAY (always rendered, visibility controlled by CSS)
    // ============================================
    const desktopFilterOverlay = (
        <div className={`desktop-filter-overlay ${showFilterModal ? 'visible' : ''}`} onClick={() => setShowFilterModal(false)}>
            <div className="desktop-filter-panel" onClick={(e) => e.stopPropagation()}>
                <div className="desktop-filter-header">
                    <span>{t('filter.filterClaims', 'Filter Claims')}</span>
                    <button onClick={() => setShowFilterModal(false)} className="text-gray-500 hover:text-gray-700">
                        <i className="pi pi-times text-lg" />
                    </button>
                </div>
                <div className="desktop-filter-body">
                    {/* Request # */}
                    <div className="desktop-filter-field">
                        <label>{t('claims.requestNumber')}</label>
                        <InputText
                            value={filterValues.requestId}
                            onChange={(e) => setFilterValues({ ...filterValues, requestId: e.target.value })}
                            placeholder={t('filter.searchById', 'Search by ID...')}
                            className="w-full"
                        />
                    </div>

                    {/* Claim Type */}
                    <div className="desktop-filter-field">
                        <label>{t('claims.claimType')}</label>
                        <Dropdown
                            value={filterValues.type}
                            options={claimTypes.map(opt => ({ label: opt.claim_type_name, value: opt.claim_type_name }))}
                            onChange={(e) => setFilterValues({ ...filterValues, type: e.value })}
                            placeholder={t('filter.allTypes', 'All Types')}
                            showClear
                            className="w-full"
                        />
                    </div>

                    {/* Total Amount Range - Compact */}
                    <div className="desktop-filter-field">
                        <label>{t('claims.totalAmount')}</label>
                        <div className="flex gap-2 items-center">
                            <InputNumber
                                value={filterValues.amountMin}
                                onValueChange={(e) => setFilterValues({ ...filterValues, amountMin: e.value })}
                                placeholder={t('filter.min', 'Min')}
                                className="flex-1 amount-input-compact"
                            />
                            <span className="text-gray-400">~</span>
                            <InputNumber
                                value={filterValues.amountMax}
                                onValueChange={(e) => setFilterValues({ ...filterValues, amountMax: e.value })}
                                placeholder={t('filter.max', 'Max')}
                                className="flex-1 amount-input-compact"
                            />
                        </div>
                    </div>

                    {/* Submitted At Date Range - Compact */}
                    <div className="desktop-filter-field">
                        <label>{t('claims.submittedAt')}</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-12">{t('filter.from')}</span>
                                <input
                                    type="date"
                                    value={filterValues.dateFrom || ''}
                                    onChange={(e) => setFilterValues({ ...filterValues, dateFrom: e.target.value })}
                                    className="flex-1 date-input-compact"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-12">{t('filter.to')}</span>
                                <input
                                    type="date"
                                    value={filterValues.dateTo || ''}
                                    onChange={(e) => setFilterValues({ ...filterValues, dateTo: e.target.value })}
                                    className="flex-1 date-input-compact"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="desktop-filter-field">
                        <label>{t('common.status')}</label>
                        <Dropdown
                            value={filterValues.status}
                            options={claimStatus.map(opt => ({ label: opt.claim_status_name, value: opt.claim_status_name }))}
                            onChange={(e) => setFilterValues({ ...filterValues, status: e.value })}
                            placeholder={t('filter.allStatuses', 'All Statuses')}
                            showClear
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="desktop-filter-actions">
                    <Button label={t('common.clear', 'Clear')} icon="pi pi-times" outlined onClick={clearDesktopFilters} className="flex-1" />
                    <Button label={t('common.apply', 'Apply')} icon="pi pi-check" onClick={applyDesktopFilters} className="flex-1" />
                </div>
            </div>
        </div>
    )

    // ============================================
    // DESKTOP TABLE VIEW
    // ============================================
    const pendingStatusName = claimStatus?.find(s => s.claim_status_id === 1)?.claim_status_name || 'Pending'
    const isPendingActive = filterValues.status === pendingStatusName

    const adminHeaderTemplate = () => (
        <>
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder={t('common.keywordSearch')}
                            className="w-64"
                        />
                    </IconField>
                    <Button
                        label={t('claims.filter', 'Filter')}
                        icon="pi pi-filter"
                        outlined
                        onClick={() => setShowFilterModal(true)}
                        badge={hasActiveFilters ? "●" : undefined}
                        badgeClassName="p-badge-info"
                        className="filter-button"
                    />
                    <Button
                        label={t('claims.pending', 'Pending')}
                        icon="pi pi-clock"
                        outlined={!isPendingActive}
                        severity={isPendingActive ? 'info' : 'secondary'}
                        onClick={togglePendingFilter}
                        className={`filter-button ${isPendingActive ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                        tooltip={t('claims.showPending', 'Show Pending Claims')}
                    />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button label={t('claims.approve', 'Approve')} outlined className={BUTTON_STYLE.success} icon="pi pi-check" iconPos="right"
                        onClick={bulkApproveClaim} disabled={isDisabled || isExporting} />
                    <Button label={t('claims.reject', 'Reject')} outlined className={BUTTON_STYLE.danger} icon="pi pi-times" iconPos="right"
                        onClick={bulkRejectClaim} disabled={isDisabled || isExporting} />
                    <Button
                        label={t('claims.export', 'Export')}
                        outlined
                        icon="pi pi-file-export"
                        iconPos="right"
                        onClick={handleExportPdf}
                        disabled={isDisabled || isExporting}
                        loading={isExporting}
                    />
                    <Link to={`${path}/claims/create-claim`}>
                        <Button label={t('claims.newClaim', 'New Claim')} icon="pi pi-plus" iconPos="right" />
                    </Link>
                </div>
            </div>
            {selectedClaims.length > 0 && (
                <div className="mt-2">
                    <span className="text-sm font-medium text-gray-600">
                        {selectedClaims.length} {t('common.selected', 'selected')}
                    </span>
                </div>
            )}
        </>
    )

    const userHeaderTemplate = () => (
        <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder={t('common.keywordSearch')}
                        className="w-64"
                    />
                </IconField>
                <Button
                    label={t('claims.filter', 'Filter')}
                    icon="pi pi-filter"
                    outlined
                    onClick={() => setShowFilterModal(true)}
                    badge={hasActiveFilters ? "●" : undefined}
                    badgeClassName="p-badge-info"
                    className="filter-button"
                />
            </div>

            <div className="flex gap-2">
                <Link to={`${path}/claims/create-claim`}>
                    <Button label={t('claims.newClaim', 'New Claim')} icon="pi pi-plus" iconPos="right" />
                </Link>
            </div>

        </div>
    )

    const desktopTableView = (
        <>
            {desktopFilterOverlay}
            <ComponentContainer>
                <DataTable value={claims} header={user === 'admin' ? adminHeaderTemplate : userHeaderTemplate}
                    paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    filters={filters}
                    globalFilterFields={[
                        'claim_id',
                        'claim_type.claim_type_name',
                        'total_amount',
                        'claim_submitted',
                        'status.claim_status_name',
                    ]}
                    selectionMode="checkbox"
                    selection={selectedClaims} onSelectionChange={(e) => setSelectedClaims(e.value)}
                    dataKey="claim_id"
                    tableStyle={{ minWidth: '50rem' }}
                    className="claims-datatable"
                    removableSort
                >

                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}
                        headerClassName="checkbox-header" bodyClassName="checkbox-cell text-center"></Column>

                    <Column field="claim_id" header={t('claims.requestNumber', 'Request #')} sortable style={{ minWidth: '4rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>

                    <Column field="claim_type.claim_type_name" header={t('claims.claimType')} sortable style={{ minWidth: '8rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>

                    <Column field="total_amount" header={t('claims.totalAmount')} body={totalAmountBodyTemplate} sortable style={{ minWidth: '8rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>

                    <Column field="claim_submitted" header={t('claims.submittedAt', 'Submitted At')} sortable style={{ minWidth: '11rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>

                    <Column field="status.claim_status_name" header={t('common.status')} body={statusBodyTemplate} sortable style={{ minWidth: '8rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>

                    <Column header={t('common.actions')} body={actionBodyTemplate} style={{ minWidth: '4rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>

                </DataTable>
            </ComponentContainer>
        </>
    )

    // ============================================
    // MOBILE CARD VIEW (always rendered, visibility controlled by CSS)
    // ============================================
    const mobileFilterModal = (
        <div className={`mobile-filter-overlay ${showFilterModal ? 'visible' : ''}`} onClick={() => setShowFilterModal(false)}>
            <div className="mobile-filter-panel" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-filter-header">
                    <span>{t('filter.filterClaims', 'Filter Claims')}</span>
                    <button onClick={() => setShowFilterModal(false)} className="text-gray-500">
                        <i className="pi pi-times" />
                    </button>
                </div>
                <div className="mobile-filter-body">
                    <div className="mobile-filter-field">
                        <label>{t('filter.keyword', 'Keyword')}</label>
                        <InputText
                            value={filterValues.keyword}
                            onChange={(e) => setFilterValues({ ...filterValues, keyword: e.target.value })}
                            placeholder={t('filter.searchByIdOrType', 'Search by ID or type...')}
                            className="w-full"
                        />
                    </div>
                    <div className="mobile-filter-field">
                        <label>{t('claims.claimType')}</label>
                        <Dropdown
                            value={filterValues.type}
                            options={claimTypes.map(opt => ({ label: opt.claim_type_name, value: opt.claim_type_name }))}
                            onChange={(e) => setFilterValues({ ...filterValues, type: e.value })}
                            placeholder={t('filter.allTypes', 'All Types')}
                            showClear
                            className="w-full"
                        />
                    </div>
                    <div className="mobile-filter-field">
                        <label>{t('claims.totalAmount')}</label>
                        <div className="flex gap-2 items-center">
                            <InputNumber
                                value={filterValues.amountMin}
                                onValueChange={(e) => setFilterValues({ ...filterValues, amountMin: e.value })}
                                placeholder={t('filter.min', 'Min')}
                                className="flex-1"
                            />
                            <span className="text-gray-400">~</span>
                            <InputNumber
                                value={filterValues.amountMax}
                                onValueChange={(e) => setFilterValues({ ...filterValues, amountMax: e.value })}
                                placeholder={t('filter.max', 'Max')}
                                className="flex-1"
                            />
                        </div>
                    </div>
                    <div className="mobile-filter-field">
                        <label>{t('claims.submittedAt')}</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-10">{t('filter.from')}</span>
                                <input
                                    type="date"
                                    value={filterValues.dateFrom || ''}
                                    onChange={(e) => setFilterValues({ ...filterValues, dateFrom: e.target.value })}
                                    className="flex-1 date-input-compact"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-10">{t('filter.to')}</span>
                                <input
                                    type="date"
                                    value={filterValues.dateTo || ''}
                                    onChange={(e) => setFilterValues({ ...filterValues, dateTo: e.target.value })}
                                    className="flex-1 date-input-compact"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mobile-filter-field">
                        <label>{t('common.status')}</label>
                        <Dropdown
                            value={filterValues.status}
                            options={claimStatus.map(opt => ({ label: opt.claim_status_name, value: opt.claim_status_name }))}
                            onChange={(e) => setFilterValues({ ...filterValues, status: e.value })}
                            placeholder={t('filter.allStatuses', 'All Statuses')}
                            showClear
                            className="w-full"
                        />
                    </div>
                </div>
                <div className="mobile-filter-actions">
                    <Button label={t('common.clear', 'Clear')} icon="pi pi-times" outlined onClick={clearMobileFilters} className="flex-1" />
                    <Button label={t('common.apply', 'Apply')} icon="pi pi-check" onClick={applyMobileFilters} className="flex-1" />
                </div>
            </div>
        </div>
    )

    const MobileHeader = () => (
        <div className="mobile-claims-header">
            <div className="flex items-center gap-2 mb-3">
                <button
                    className={`mobile-filter-btn ${hasActiveFilters ? 'mobile-filter-btn-active' : ''}`}
                    onClick={() => setShowFilterModal(true)}
                >
                    <i className="pi pi-filter" />
                    <span>{t('claims.filter', 'Filter')}</span>
                    {hasActiveFilters && <span className="mobile-filter-badge">●</span>}
                </button>

                <button
                    className={`mobile-filter-btn ${filterValues.status === (claimStatus?.find(s => s.claim_status_id === 1)?.claim_status_name || 'Pending') ? 'mobile-filter-btn-active bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                    onClick={togglePendingFilter}
                >
                    <i className="pi pi-clock" />
                    <span className="hidden sm:inline">Pending</span>
                </button>

                {/* Approve/Reject icon buttons for admin */}
                {user === 'admin' && (
                    <>
                        <Button
                            icon="pi pi-thumbs-up"
                            rounded
                            outlined
                            severity="success"
                            size="small"
                            onClick={bulkApproveClaim}
                            disabled={selectedClaims.length === 0 || isExporting}
                            tooltip="Approve"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                        <Button
                            icon="pi pi-thumbs-down"
                            rounded
                            outlined
                            severity="danger"
                            size="small"
                            onClick={bulkRejectClaim}
                            disabled={selectedClaims.length === 0 || isExporting}
                            tooltip="Reject"
                            tooltipOptions={{ position: 'bottom' }}
                        />
                    </>
                )}

                <Link to={`${path}/claims/create-claim`}>
                    <Button icon="pi pi-plus" label={t('common.new', 'New')} size="small" className="mobile-icon-only-btn" />
                </Link>
            </div>

            {user === 'admin' && selectedClaims.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3 items-center">
                    <span className="text-sm text-gray-600">{selectedClaims.length} {t('common.selected', 'selected')}</span>
                    <Button
                        label={isExporting ? "..." : t('claims.export', 'Export')}
                        size="small"
                        outlined
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        loading={isExporting}
                    />
                </div>
            )}
        </div>
    )

    const ClaimCard = ({ claim }) => {
        const isSelected = selectedClaims.some(c => c.claim_id === claim.claim_id)
        const statusName = claim.status?.claim_status_name || 'Unknown'
        const statusColor = STATUS_COLORS[statusName] || 'bg-gray-100 text-gray-800'

        return (
            <div className={`claim-card ${isSelected ? 'claim-card-selected' : ''}`}>
                <div className="claim-card-header">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            checked={isSelected}
                            onChange={() => toggleClaimSelection(claim)}
                        />
                        <div>
                            <div className="text-xs text-gray-500">{t('claims.requestNumber', 'ID')}: {claim.claim_id}</div>
                            <div className="text-sm font-medium">
                                {claim.claim_type?.claim_type_name} · ${claim.total_amount}
                            </div>
                        </div>
                    </div>
                    <span className={`claim-card-status ${statusColor}`}>
                        {statusName}
                    </span>
                </div>
                <div className="claim-card-body">
                    <div className="claim-card-detail">
                        <span className="text-gray-500 text-xs">{t('claims.submittedAt', 'Date')}</span>
                        <div className="text-sm">{claim.claim_submitted}</div>
                    </div>
                    <div className="claim-card-actions">
                        {user === 'admin' ? (
                            <Link to={`${claim.claim_id}/edit-claim`}>
                                <Button icon="pi pi-pencil" size="small" text />
                            </Link>
                        ) : (
                            <Link to={`${claim.claim_id}/view-claim`}>
                                <Button icon="pi pi-eye" size="small" text />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const mobileCardView = (
        <div className="mobile-claims-container">
            {mobileFilterModal}
            <MobileHeader />

            <div className="mobile-claims-list">
                {filteredClaims.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults', 'No claims found')}
                    </div>
                ) : (
                    filteredClaims.map(claim => (
                        <ClaimCard key={claim.claim_id} claim={claim} />
                    ))
                )}
            </div>
        </div>
    )

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="claims-list-wrapper">
            {isMobile ? mobileCardView : desktopTableView}
        </div>
    )
}

export default ClaimListDataTable