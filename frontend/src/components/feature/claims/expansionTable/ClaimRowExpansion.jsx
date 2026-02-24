import React from 'react'
import ClaimExpansionDropdownRow from './ClaimExpansionDropdownRow.jsx'
import ClaimExpansionInputRow from './ClaimExpansionInputRow.jsx'
import ClaimExpansionAttachmentRow from './ClaimExpansionAttachmentRow.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import ClaimExpansionMultiSelectRow from './ClaimExpansionMultiSelectRow.jsx'
import { getFileIcon } from '../uploadAttchment/getFileIcon.jsx'
import { API_BASE_URL } from '../../../../api/api.js'
import Input from '../../../common/ui/Input.jsx'


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
                    console.log(mileage);
                    
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

                    // Get receipts from a transaction (handles backend `receipts` and frontend `attachment` formats)
                    const getTransactionReceipts = (tx) => {
                        if (tx.attachment) return tx.attachment
                        if (tx.receipts) {
                            return tx.receipts.map(r => ({
                                url: `${API_BASE_URL}/storage/${r.file_path}`,
                                name: r.file_name,
                                fileType: r.file_type,
                                receipt_id: r.receipt_id,
                            }))
                        }
                        return []
                    }

                    const handleMileageReceiptUpload = (txIndex, e) => {
                        const selectedFiles = Array.from(e.target.files)
                        if (!selectedFiles.length) return
                        const newFiles = selectedFiles.map(file => ({
                            file,
                            url: URL.createObjectURL(file),
                            name: file.name,
                            fileType: file.type,
                            isNew: true,
                        }))
                        const updatedTransactions = mileage.transactions.map((tx, i) => {
                            if (i !== txIndex) return tx
                            const existing = getTransactionReceipts(tx)
                            return { ...tx, attachment: [...existing, ...newFiles] }
                        })
                        handleInputChange(rowData.transactionId, 'mileage', { ...mileage, transactions: updatedTransactions })
                        e.target.value = ''
                    }

                    const handleMileageReceiptRemove = (txIndex, fileIndex) => {
                        const tx = mileage.transactions[txIndex]
                        const receipts = getTransactionReceipts(tx)
                        const fileToRemove = receipts[fileIndex]

                        if (fileToRemove?.url?.startsWith('blob:')) {
                            URL.revokeObjectURL(fileToRemove.url)
                        }

                        const updatedReceipts = receipts.filter((_, i) => i !== fileIndex)

                        // Track deleted backend receipt IDs per transaction
                        let deletedMileageReceiptIds = mileage._deletedReceiptIds || {}
                        if (fileToRemove?.receipt_id) {
                            const txId = tx.transaction_id || tx.transactionId
                            deletedMileageReceiptIds = {
                                ...deletedMileageReceiptIds,
                                [txId]: [...(deletedMileageReceiptIds[txId] || []), fileToRemove.receipt_id],
                            }
                        }

                        const updatedTransactions = mileage.transactions.map((t, i) => {
                            if (i !== txIndex) return t
                            return { ...t, attachment: updatedReceipts }
                        })
                        handleInputChange(rowData.transactionId, 'mileage', {
                            ...mileage,
                            transactions: updatedTransactions,
                            _deletedReceiptIds: deletedMileageReceiptIds,
                        })
                    }

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
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    {isEditing ? (
                                        <div className="flex gap-0.5">
                                                <Input name="period_of_from" type='date' value={mileage.period_of_from?.substring(0, 10) || ''} onChange={(e) => updateMileageHeader('period_of_from', e.target.value)} />
                                                <Input name="period_of_to" type='date' value={mileage.period_of_to?.substring(0, 10) || ''} onChange={(e) => updateMileageHeader('period_of_to', e.target.value)} />
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
                                            <th className="px-4 py-2.5 text-left font-medium">{t('mileage.travelFrom', 'Travel From')}</th>
                                            <th className="px-4 py-2.5 text-left font-medium">{t('mileage.travelTo', 'Travel To')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.distance', 'Distance (km)')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.rate', 'Rate ($/km)')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.meter', 'Meter ($)')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.parking', 'Parking ($)')}</th>
                                            <th className="px-4 py-2.5 text-left font-medium">{t('mileage.buyer', 'Buyer')}</th>
                                            <th className="px-4 py-2.5 text-right font-medium">{t('mileage.totalAmount', 'Amount')}</th>
                                            <th className="px-4 py-2.5 text-left font-medium">{t('mileage.receipt', 'Receipt')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mileage.transactions.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-4 py-2 text-gray-800">
                                                    {isEditing ? (
                                                        <Input
                                                            name={`tx_date_${idx}`}
                                                            type="date"
                                                            value={tx.transaction_date?.substring(0, 10) || ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'transaction_date', e.target.value)}
                                                        />
                                                    ) : tx.transaction_date?.substring(0, 10)}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">
                                                    {isEditing ? (
                                                        <Input
                                                            name={`tx_travel_from_${idx}`}
                                                            value={tx.travel_from || ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'travel_from', e.target.value)}
                                                        />
                                                    ) : (tx.travel_from || '—')}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">
                                                    {isEditing ? (
                                                        <Input
                                                            name={`tx_travel_to_${idx}`}
                                                            value={tx.travel_to || ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'travel_to', e.target.value)}
                                                        />
                                                    ) : (tx.travel_to || '—')}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    {isEditing ? (
                                                        <Input
                                                            name={`tx_distance_${idx}`}
                                                            type="number"
                                                            value={tx.distance_km ?? ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'distance_km', e.target.value)}
                                                        />
                                                    ) : parseFloat(tx.distance_km || 0).toFixed(1)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    ${parseFloat(tx.mileage_rate || rate || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    {isEditing ? (
                                                        <Input
                                                            name={`tx_meter_${idx}`}
                                                            type="number"
                                                            value={tx.meter_km ?? ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'meter_km', e.target.value)}
                                                        />
                                                    ) : `$${parseFloat(tx.meter_km || 0).toFixed(2)}`}
                                                </td>
                                                <td className="px-4 py-2 text-right text-gray-700">
                                                    {isEditing ? (
                                                        <Input
                                                            name={`tx_parking_${idx}`}
                                                            type="number"
                                                            value={tx.parking_amount ?? ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'parking_amount', e.target.value)}
                                                        />
                                                    ) : `$${parseFloat(tx.parking_amount || 0).toFixed(2)}`}
                                                </td>
                                                <td className="px-4 py-2 text-gray-700">
                                                    {isEditing ? (
                                                        <Input
                                                            name={`tx_buyer_${idx}`}
                                                            value={tx.buyer || ''}
                                                            onChange={(e) => updateMileageTransaction(idx, 'buyer', e.target.value)}
                                                        />
                                                    ) : (tx.buyer || '—')}
                                                </td>
                                                <td className="px-4 py-2 text-right font-semibold text-blue-700">
                                                    ${parseFloat(tx.total_amount || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {(() => {
                                                        const receipts = getTransactionReceipts(tx)
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                {receipts.length > 0 && (
                                                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                                        {receipts.map((att, i) => {
                                                                            const fileName = att.file ? att.file.name : (att.name || 'Attachment')
                                                                            const fileType = att.file ? att.file.type : (att.fileType || 'application/octet-stream')
                                                                            const fileUrl = att.url || att.path
                                                                            return (
                                                                                <div key={i} className="flex items-center gap-1 text-xs leading-tight">
                                                                                    <span className="shrink-0 [&_svg]:mr-0">{getFileIcon(fileType)}</span>
                                                                                    <a
                                                                                        href={fileUrl}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-blue-600 hover:underline truncate max-w-[100px]"
                                                                                        title={fileName}
                                                                                    >
                                                                                        {fileName}
                                                                                    </a>
                                                                                    {isEditing && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleMileageReceiptRemove(idx, i)}
                                                                                            className="shrink-0 text-red-500 hover:text-red-700 cursor-pointer ml-0.5"
                                                                                        >
                                                                                            <i className="pi pi-times text-[10px]" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )}
                                                                {isEditing && (
                                                                    <label className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer w-fit">
                                                                        <i className="pi pi-upload text-[10px]" />
                                                                        <span>{t('components.upload', 'Upload')}</span>
                                                                        <input
                                                                            type="file"
                                                                            multiple
                                                                            accept="image/*,application/pdf"
                                                                            onChange={(e) => handleMileageReceiptUpload(idx, e)}
                                                                            className="hidden"
                                                                        />
                                                                    </label>
                                                                )}
                                                                {receipts.length === 0 && !isEditing && (
                                                                    <span className="text-gray-400 text-xs">—</span>
                                                                )}
                                                            </div>
                                                        )
                                                    })()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-blue-50/40 font-semibold text-sm">
                                            <td className="px-4 py-2.5 text-gray-700">{t('claims.total', 'Total')}</td>
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5 text-right text-gray-700">{totalKm.toFixed(1)} km</td>
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5" />
                                            <td className="px-4 py-2.5 text-right text-blue-700">${mileageTotal.toFixed(2)}</td>
                                            <td className="px-4 py-2.5" />
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