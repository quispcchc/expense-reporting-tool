import { Link } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Checkbox } from 'primereact/checkbox'
import { useTranslation } from 'react-i18next'
import { USER_TYPE } from '../../../config/constants.js'

function MobileClaimListHeader({
    user,
    path,
    hasActiveFilters,
    isPendingActive,
    selectedClaims,
    filteredClaims = [],
    onSelectAll,
    isExporting,
    onShowFilter,
    onTogglePending,
    onBulkApprove,
    onBulkReject,
    onExportPdf,
}) {
    const { t } = useTranslation()
    const allSelected = filteredClaims.length > 0 && selectedClaims.length === filteredClaims.length

    return (
        <div className="mobile-claims-header">
            {/* Action buttons row */}
            <div className="flex items-center gap-2 mb-3">
                <button
                    className={`mobile-filter-btn ${hasActiveFilters ? 'mobile-filter-btn-active bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                    onClick={onShowFilter}
                >
                    <i className="pi pi-filter" />
                    <span className="hidden sm:inline">{t('claims.filter', 'Filter')}</span>
                </button>

                <button
                    className={`mobile-filter-btn ${isPendingActive ? 'mobile-filter-btn-active bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                    onClick={onTogglePending}
                >
                    <i className="pi pi-clock" />
                    <span className="hidden sm:inline">{t('claims.pending', 'Pending')}</span>
                </button>

                {user === USER_TYPE.ADMIN && (
                    <>
                        <Button
                            icon="pi pi-thumbs-up"
                            rounded
                            outlined
                            severity="success"
                            size="small"
                            onClick={onBulkApprove}
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
                            onClick={onBulkReject}
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

            {/* Selection bar — sits just above the cards list */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={allSelected}
                        onChange={(e) => onSelectAll(e.checked)}
                    />
                    <span className="text-sm text-gray-600">
                        {selectedClaims.length > 0
                            ? `${selectedClaims.length} ${t('common.selected', 'selected')}`
                            : t('common.selectAll', 'Select all')}
                    </span>
                </div>
                {user === USER_TYPE.ADMIN && selectedClaims.length > 0 && (
                    <Button
                        label={isExporting ? "..." : t('claims.export', 'Export')}
                        size="small"
                        outlined
                        onClick={onExportPdf}
                        disabled={isExporting}
                        loading={isExporting}
                    />
                )}
            </div>
        </div>
    )
}

export default MobileClaimListHeader
