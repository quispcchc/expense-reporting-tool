import React from 'react'
import ClaimExpansionDropdownRow from './ClaimExpansionDropdownRow.jsx'
import ClaimExpansionInputRow from './ClaimExpansionInputRow.jsx'
import ClaimExpansionAttachmentRow from './ClaimExpansionAttachmentRow.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import ClaimExpansionMultiSelectRow from './ClaimExpansionMultiSelectRow.jsx'

function ClaimRowExpansion({
    rowData,
    editingRowId,
    claimItems,
    expandedRowData,
    handleInputChange,
    mode,
}) {
    const { t } = useTranslation()
    const { lookups: { projects } } = useLookups()

    // Determine if the current row is in editing mode
    const isEditing = editingRowId === rowData.transactionId

    // Get the original claim item data for this row
    const currentData = claimItems.find(item => item.transactionId === rowData.transactionId) || rowData

    // Get any changes made in the expanded row for this transactionId
    const expansionChanges = expandedRowData[rowData.transactionId] || {}

    // Merge original data with any expanded data changes
    // For attachment field: if expansion has changes, use ONLY those (not merged) to prevent duplication
    const displayData = {
        ...currentData,
        ...expansionChanges,
        // If expansionChanges explicitly set attachment, use that value only (could be new files only)
        // Otherwise fall back to currentData.attachment
        attachment: expansionChanges.hasOwnProperty('attachment')
            ? expansionChanges.attachment
            : currentData.attachment
    }

    // Convert tags array to comma-separated string or fallback to empty string
    const getTagsValue = (tags) => {

        if (!tags) return ''

        // String → return directly
        if (typeof tags === 'string') {
            return tags
        }

        // Array
        if (Array.isArray(tags)) {
            // Array of objects (edit/view)
            if (tags.length && typeof tags[0] === 'object') {
                return tags.map(tag => tag.tag_name).join(',');
            }

            // Array of strings (create)
            return tags.join(',');
        }
        return ''
    }


    return (
        <div
            key={`expansion-${displayData.transactionId}`}
            className="px-18"
        >
            <div className="grid grid-cols-1 gap-4">
                {/* Dropdown to select program/project */}
                <ClaimExpansionDropdownRow
                    label={t('expenses.program')}
                    field="program"
                    placeholder={t('expenses.selectProgram', 'Please select the program')}
                    options={projects.map(
                        opt => ({ label: `${opt.project_name} - ${opt.project_desc}`, value: opt.project_id }))}
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.program || ''}
                    handleInputChange={handleInputChange}
                />

                    {/* Multi-select for tags */}
                    <ClaimExpansionMultiSelectRow
                        label={t('expenses.tags', 'Tags')}
                        field="tags"
                        isEditing={isEditing}
                        rowData={rowData}
                        value={Array.isArray(displayData.tags)
                            ? displayData.tags
                            : (displayData.tags ? [displayData.tags] : [])}
                        handleInputChange={handleInputChange}
                    />

                {/* Input for expense description */}
                <ClaimExpansionInputRow
                    label={t('expenses.description')}
                    field="description"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.description || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Input for notes */}
                <ClaimExpansionInputRow
                    label={t('expenses.notes')}
                    field="notes"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.notes || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Attachment list and upload functionality */}
                <ClaimExpansionAttachmentRow
                    label={t('expenses.attachments')}
                    isEditing={isEditing}
                    file={displayData.attachment || null}
                    rowData={rowData}
                    handleInputChange={handleInputChange}
                    mode={mode}
                />

                {/* Mileage details if bound to this expense */}
                {displayData.mileage?.transactions?.length > 0 && (() => {
                    const mileage = displayData.mileage
                    const mileageTotal = mileage.transactions.reduce((s, tx) => s + (parseFloat(tx.total_amount) || 0), 0)
                    const totalKm = mileage.transactions.reduce((s, tx) => s + (parseFloat(tx.distance_km) || 0), 0)
                    const rate = mileage.transactions[0]?.mileage_rate

                    const updateMileageHeader = (field, value) => {
                        handleInputChange(rowData.transactionId, 'mileage', { ...mileage, [field]: value })
                    }

                    const updateMileageTransaction = (txIndex, field, value) => {
                        const updatedTransactions = mileage.transactions.map((tx, i) => {
                            if (i !== txIndex) return tx
                            const updated = { ...tx, [field]: value }
                            const r = parseFloat(updated.mileage_rate || rate) || 0
                            updated.total_amount = parseFloat((
                                (parseFloat(updated.distance_km) || 0) * r +
                                (parseFloat(updated.meter_km) || 0) +
                                (parseFloat(updated.parking_amount) || 0)
                            ).toFixed(2))
                            return updated
                        })
                        handleInputChange(rowData.transactionId, 'mileage', { ...mileage, transactions: updatedTransactions })
                    }

                    const inputCls = 'border border-blue-300 rounded px-1 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white'
                    const cellInputCls = 'border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white'

                    return (
                        <div className="mt-3 rounded-xl overflow-hidden border border-blue-200 shadow-sm">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <i className="pi pi-car text-blue-600 text-sm" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">
                                            {t('mileage.boundMileage', 'Mileage Details')}
                                        </p>
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <input
                                                    type="text"
                                                    value={mileage.travel_from || ''}
                                                    onChange={(e) => updateMileageHeader('travel_from', e.target.value)}
                                                    placeholder={t('mileage.from', 'From')}
                                                    className={`${inputCls} w-24`}
                                                />
                                                <span className="text-blue-400 text-xs">→</span>
                                                <input
                                                    type="text"
                                                    value={mileage.travel_to || ''}
                                                    onChange={(e) => updateMileageHeader('travel_to', e.target.value)}
                                                    placeholder={t('mileage.to', 'To')}
                                                    className={`${inputCls} w-24`}
                                                />
                                            </div>
                                        ) : (mileage.travel_from || mileage.travel_to) && (
                                            <p className="text-xs text-blue-600">
                                                {mileage.travel_from} → {mileage.travel_to}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-blue-400">{t('mileage.from', 'From')}</span>
                                                <input
                                                    type="date"
                                                    value={mileage.period_of_from?.substring(0, 10) || ''}
                                                    onChange={(e) => updateMileageHeader('period_of_from', e.target.value)}
                                                    className={inputCls}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-blue-400">{t('mileage.to', 'To')}</span>
                                                <input
                                                    type="date"
                                                    value={mileage.period_of_to?.substring(0, 10) || ''}
                                                    onChange={(e) => updateMileageHeader('period_of_to', e.target.value)}
                                                    className={inputCls}
                                                />
                                            </div>
                                        </div>
                                    ) : (mileage.period_of_from || mileage.period_of_to) && (
                                        <div className="hidden sm:block">
                                            <p className="text-[10px] uppercase tracking-wider text-blue-400">{t('mileage.period', 'Period')}</p>
                                            <p className="text-xs font-medium text-blue-700">
                                                {mileage.period_of_from?.substring(0, 10)} — {mileage.period_of_to?.substring(0, 10)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-blue-400">{t('claims.total', 'Total')}</p>
                                        <p className="text-base font-bold text-blue-700">${mileageTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transactions table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-blue-50/60 text-xs text-gray-500 uppercase tracking-wider">
                                            <th className="px-4 py-2.5 text-left font-medium">{t('mileage.transactionDate', 'Date')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.distance', 'Distance (km)')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.rate', 'Rate ($/km)')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.meter', 'Meter ($)')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.parking', 'Parking ($)')}</th>
                                            <th className="px-4 py-2.5 text-left font-medium">{t('mileage.buyer', 'Buyer')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.totalAmount', 'Amount')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mileage.transactions.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-4 py-2 text-gray-800">
                                                    {isEditing ? (
                                                        <input
                                                            type="date"
                                                            value={tx.transaction_date?.substring(0, 10) || ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'transaction_date', e.target.value)}
                                                            className={cellInputCls}
                                                        />
                                                    ) : tx.transaction_date?.substring(0, 10)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={tx.distance_km ?? ''}
                                                            min="0" step="0.1"
                                                            onChange={(e) => updateMileageTransaction(idx, 'distance_km', e.target.value)}
                                                            className={`${cellInputCls} w-20 text-right`}
                                                        />
                                                    ) : parseFloat(tx.distance_km || 0).toFixed(1)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    ${parseFloat(tx.mileage_rate || rate || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={tx.meter_km ?? ''}
                                                            min="0" step="0.01"
                                                            onChange={(e) => updateMileageTransaction(idx, 'meter_km', e.target.value)}
                                                            className={`${cellInputCls} w-20 text-right`}
                                                        />
                                                    ) : `$${parseFloat(tx.meter_km || 0).toFixed(2)}`}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    {isEditing ? (
                                                        <input
                                                            type="number"
                                                            value={tx.parking_amount ?? ''}
                                                            min="0" step="0.01"
                                                            onChange={(e) => updateMileageTransaction(idx, 'parking_amount', e.target.value)}
                                                            className={`${cellInputCls} w-20 text-right`}
                                                        />
                                                    ) : `$${parseFloat(tx.parking_amount || 0).toFixed(2)}`}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={tx.buyer || ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'buyer', e.target.value)}
                                                            className={`${cellInputCls} w-full`}
                                                        />
                                                    ) : (tx.buyer || '—')}
                                                </td>
                                                <td className="px-4 py-2 text-right font-semibold text-blue-700">
                                                    ${parseFloat(tx.total_amount || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-blue-50/40 font-semibold text-sm">
                                            <td className="px-4 py-2.5 text-gray-700">{t('claims.total', 'Total')}</td>
                                            <td className="px-4 py-2.5 text-right text-gray-700">{totalKm.toFixed(1)} km</td>
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5 text-right text-blue-700">${mileageTotal.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )
                })()}
            </div>
        </div>
    )
}

export default ClaimRowExpansion