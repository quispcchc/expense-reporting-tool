import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'

function ClaimListFilterPanel({
    variant,
    filterValues,
    setFilterValues,
    claimTypes,
    claimStatus,
    onApply,
    onClear,
    onClose,
    visible,
}) {
    const { t } = useTranslation()
    const prefix = variant === 'desktop' ? 'desktop-filter' : 'mobile-filter'
    const dateLabelClass = variant === 'desktop'
        ? 'text-sm text-gray-500 w-12'
        : 'text-xs text-gray-500 w-10'

    const claimTypeOptions = claimTypes.map(opt => ({ label: opt.claim_type_name, value: opt.claim_type_name }))
    const statusOptions = claimStatus.map(opt => ({ label: opt.claim_status_name, value: opt.claim_status_name }))

    const updateFilter = (field, value) => {
        setFilterValues(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className={`${prefix}-overlay ${visible ? 'visible' : ''}`} onClick={onClose}>
            <div className={`${prefix}-panel`} onClick={(e) => e.stopPropagation()}>
                <div className={`${prefix}-header`}>
                    <span>{t('filter.filterClaims', 'Filter Claims')}</span>
                    <button onClick={onClose} className={`text-gray-500 ${variant === 'desktop' ? 'hover:text-gray-700' : ''}`}>
                        <i className={`pi pi-times ${variant === 'desktop' ? 'text-lg' : ''}`} />
                    </button>
                </div>
                <div className={`${prefix}-body`}>
                    {/* Keyword — mobile only */}
                    {variant === 'mobile' && (
                        <div className={`${prefix}-field`}>
                            <label>{t('filter.keyword', 'Keyword')}</label>
                            <InputText
                                value={filterValues.keyword}
                                onChange={(e) => updateFilter('keyword', e.target.value)}
                                placeholder={t('filter.searchByIdOrType', 'Search by ID or type...')}
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Request # — desktop only */}
                    {variant === 'desktop' && (
                        <div className={`${prefix}-field`}>
                            <label>{t('claims.requestNumber')}</label>
                            <InputText
                                value={filterValues.requestId}
                                onChange={(e) => updateFilter('requestId', e.target.value)}
                                placeholder={t('filter.searchById', 'Search by ID...')}
                                className="w-full"
                            />
                        </div>
                    )}

                    {/* Claim Type */}
                    <div className={`${prefix}-field`}>
                        <label>{t('claims.claimType')}</label>
                        <Dropdown
                            value={filterValues.type}
                            options={claimTypeOptions}
                            onChange={(e) => updateFilter('type', e.value)}
                            placeholder={t('filter.allTypes', 'All Types')}
                            showClear
                            className="w-full"
                        />
                    </div>

                    {/* Amount Range */}
                    <div className={`${prefix}-field`}>
                        <label>{t('claims.totalAmount')}</label>
                        <div className="flex gap-2 items-center">
                            <InputNumber
                                value={filterValues.amountMin}
                                onValueChange={(e) => updateFilter('amountMin', e.value)}
                                placeholder={t('filter.min', 'Min')}
                                className={`flex-1 ${variant === 'desktop' ? 'amount-input-compact' : ''}`}
                            />
                            <span className="text-gray-400">~</span>
                            <InputNumber
                                value={filterValues.amountMax}
                                onValueChange={(e) => updateFilter('amountMax', e.value)}
                                placeholder={t('filter.max', 'Max')}
                                className={`flex-1 ${variant === 'desktop' ? 'amount-input-compact' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className={`${prefix}-field`}>
                        <label>{t('claims.submittedAt')}</label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className={dateLabelClass}>{t('filter.from')}</span>
                                <input
                                    type="date"
                                    value={filterValues.dateFrom || ''}
                                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                                    className="flex-1 date-input-compact"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={dateLabelClass}>{t('filter.to')}</span>
                                <input
                                    type="date"
                                    value={filterValues.dateTo || ''}
                                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                                    className="flex-1 date-input-compact"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className={`${prefix}-field`}>
                        <label>{t('common.status')}</label>
                        <Dropdown
                            value={filterValues.status}
                            options={statusOptions}
                            onChange={(e) => updateFilter('status', e.value)}
                            placeholder={t('filter.allStatuses', 'All Statuses')}
                            showClear
                            className="w-full"
                        />
                    </div>
                </div>
                <div className={`${prefix}-actions`}>
                    <Button label={t('common.clear', 'Clear')} icon="pi pi-times" outlined onClick={onClear} className="flex-1" />
                    <Button label={t('common.apply', 'Apply')} icon="pi pi-check" onClick={onApply} className="flex-1" />
                </div>
            </div>
        </div>
    )
}

export default ClaimListFilterPanel
