import React, { useEffect, useState, useRef } from 'react'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import Loader from '../../common/ui/Loader.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import StatusTab from '../../common/ui/StatusTab.jsx'
import { Link } from 'react-router-dom'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { Button } from 'primereact/button'
import { BUTTON_STYLE, STATUS_STYLES } from '../../../utils/customizeStyle.js'
import { showToast } from '../../../utils/helpers.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useClaims } from '../../../contexts/ClaimContext.jsx'
import api from '../../../api/api.js'
import { confirmDialog } from 'primereact/confirmdialog'
import { useIsMobile } from '../../../hooks/useIsMobile.js'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../utils/formatters.js'
import { USER_TYPE } from '../../../config/constants.js'
import { useClaimListFilters } from '../../../hooks/useClaimListFilters.js'
import ClaimListFilterPanel from './ClaimListFilterPanel.jsx'
import MobileClaimCard from './MobileClaimCard.jsx'
import MobileClaimListHeader from './MobileClaimListHeader.jsx'

function ClaimListDataTable({ user, path, toastRef }) {
    const { t } = useTranslation()
    const { claims: allClaims, myClaims, fetchClaims, fetchMyClaims } = useClaims()
    const claims = user === USER_TYPE.ADMIN ? allClaims : myClaims
    const isMobile = useIsMobile()
    const { lookups: { claimStatus, claimTypes } } = useLookups()

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            if (user === USER_TYPE.ADMIN) {
                await fetchClaims()
            } else {
                await fetchMyClaims()
            }
            setIsLoading(false)
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    // Selection & export state
    const [selectedClaims, setSelectedClaims] = useState([])
    const isDisabled = !selectedClaims || selectedClaims.length === 0
    const [isExporting, setIsExporting] = useState(false)
    const abortControllerRef = useRef(null)

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // Filter state (hook manages all filter logic)
    const {
        globalFilterValue, onGlobalFilterChange, filters, filterValues, setFilterValues,
        filteredClaims, showFilterModal, setShowFilterModal,
        togglePendingFilter, applyMobileFilters, clearMobileFilters,
        applyDesktopFilters, clearDesktopFilters, hasActiveFilters, isPendingActive,
    } = useClaimListFilters({ claims, claimStatus })

    // ============================================
    // COLUMN TEMPLATES
    // ============================================
    const statusBodyTemplate = (rowData) => (
        <StatusTab status={rowData.claim_status_id} />
    )

    const totalAmountBodyTemplate = (rowData) => (
        <>${rowData.total_amount}</>
    )

    const actionBodyTemplate = (rowData) => (
        <>
            {user === USER_TYPE.ADMIN ?
                <Link to={`${rowData.claim_id}/edit-claim`}>
                    <button className="pi pi-pencil cursor-pointer"></button>
                </Link> : <Link to={`${rowData.claim_id}/view-claim`}>
                    <button className="pi pi-eye cursor-pointer"></button>
                </Link>}
        </>
    )

    // ============================================
    // BULK ACTIONS
    // ============================================
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1)

    function executeBulkAction(action) {
        const claimIds = selectedClaims.map(claim => claim.claim_id)

        confirmDialog({
            message: t(`claims.bulk${capitalize(action)}Message`, `Do you want to ${action} all selected claims?`),
            header: t(`claims.bulk${capitalize(action)}Header`, `Bulk ${capitalize(action)} Confirmation`),
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-info',
            accept: async () => {
                try {
                    await api.post(`claims/bulk-${action}`, { claimIds })
                    if (user === USER_TYPE.ADMIN) {
                        await fetchClaims()
                    } else {
                        await fetchMyClaims()
                    }
                    showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t(`claims.bulk${capitalize(action)}Success`) })
                } catch (error) {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error', 'Error'), detail: error.message })
                } finally {
                    setSelectedClaims([])
                }
            },
            reject: () => {
                setSelectedClaims([])
                showToast(toastRef, { severity: 'info', summary: t('toast.cancel', 'Cancel'), detail: t(`claims.bulk${capitalize(action)}Cancelled`) })
            },
        })
    }

    // ============================================
    // EXPORT
    // ============================================
    async function handleExportPdf() {
        if (!selectedClaims || selectedClaims.length === 0) {
            showToast(toastRef, {
                severity: 'warn',
                summary: t('toast.warning'),
                detail: t('claims.exportSelectWarning')
            })
            return
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        setIsExporting(true)

        try {
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
            } else {
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
            if (error?.name === 'AbortError' || error?.name === 'CanceledError') {
                return
            }

            let errorDetail = t('claims.exportFailed')
            if (error?.message) {
                errorDetail = error.message
            } else if (error?.response?.status === 500) {
                errorDetail = t('claims.exportServerError')
            } else if (error?.response?.status === 408) {
                errorDetail = t('claims.exportTimeout')
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

    // ============================================
    // MOBILE HELPERS
    // ============================================
    const toggleClaimSelection = (claim) => {
        const isSelected = selectedClaims.some(c => c.claim_id === claim.claim_id)
        if (isSelected) {
            setSelectedClaims(selectedClaims.filter(c => c.claim_id !== claim.claim_id))
        } else {
            setSelectedClaims([...selectedClaims, claim])
        }
    }

    // ============================================
    // DESKTOP HEADER TEMPLATES
    // ============================================
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
                        onClick={() => executeBulkAction('approve')} disabled={isDisabled || isExporting} />
                    <Button label={t('claims.reject', 'Reject')} outlined className={BUTTON_STYLE.danger} icon="pi pi-times" iconPos="right"
                        onClick={() => executeBulkAction('reject')} disabled={isDisabled || isExporting} />
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

    // ============================================
    // DESKTOP TABLE VIEW
    // ============================================
    const desktopTableView = (
        <>
            <ClaimListFilterPanel
                variant="desktop"
                filterValues={filterValues}
                setFilterValues={setFilterValues}
                claimTypes={claimTypes}
                claimStatus={claimStatus}
                onApply={applyDesktopFilters}
                onClear={clearDesktopFilters}
                onClose={() => setShowFilterModal(false)}
                visible={showFilterModal}
            />
            <ComponentContainer>
                <DataTable value={claims} header={user === USER_TYPE.ADMIN ? adminHeaderTemplate : userHeaderTemplate}
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
                    <Column field="claim_submitted" header={t('claims.submittedAt', 'Submitted At')} sortable style={{ minWidth: '11rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center" body={(rowData) => formatDate(rowData.claim_submitted)}></Column>
                    <Column field="status.claim_status_name" header={t('common.status')} body={statusBodyTemplate} sortable style={{ minWidth: '8rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>
                    <Column header={t('common.actions')} body={actionBodyTemplate} style={{ minWidth: '4rem' }} headerStyle={{ textAlign: 'center' }} bodyClassName="text-center"></Column>
                </DataTable>
            </ComponentContainer>
        </>
    )

    // ============================================
    // MOBILE CARD VIEW
    // ============================================
    const mobileCardView = (
        <div className="mobile-claims-container">
            <ClaimListFilterPanel
                variant="mobile"
                filterValues={filterValues}
                setFilterValues={setFilterValues}
                claimTypes={claimTypes}
                claimStatus={claimStatus}
                onApply={applyMobileFilters}
                onClear={clearMobileFilters}
                onClose={() => setShowFilterModal(false)}
                visible={showFilterModal}
            />
            <MobileClaimListHeader
                user={user}
                path={path}
                hasActiveFilters={hasActiveFilters}
                isPendingActive={isPendingActive}
                selectedClaims={selectedClaims}
                filteredClaims={filteredClaims}
                onSelectAll={(checked) => setSelectedClaims(checked ? [...filteredClaims] : [])}
                isExporting={isExporting}
                onShowFilter={() => setShowFilterModal(true)}
                onTogglePending={togglePendingFilter}
                onBulkApprove={() => executeBulkAction('approve')}
                onBulkReject={() => executeBulkAction('reject')}
                onExportPdf={handleExportPdf}
            />

            <div className="mobile-claims-list">
                {filteredClaims.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults', 'No claims found')}
                    </div>
                ) : (
                    filteredClaims.map(claim => (
                        <MobileClaimCard
                            key={claim.claim_id}
                            claim={claim}
                            isSelected={selectedClaims.some(c => c.claim_id === claim.claim_id)}
                            onToggleSelection={toggleClaimSelection}
                            user={user}
                        />
                    ))
                )}
            </div>
        </div>
    )

    // ============================================
    // RENDER
    // ============================================
    if (isLoading) return <Loader />

    return (
        <div className="claims-list-wrapper">
            {isMobile ? mobileCardView : desktopTableView}
        </div>
    )
}

export default ClaimListDataTable
