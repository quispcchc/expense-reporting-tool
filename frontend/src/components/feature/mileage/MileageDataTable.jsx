import React, { useEffect, useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { confirmDialog } from 'primereact/confirmdialog'
import { APP_SETTINGS } from '../../../config/settings.js'
import { showToast } from '../../../utils/helpers.js'
import api, { API_BASE_URL } from '../../../api/api.js'
import { getFileIcon } from '../claims/uploadAttchment/getFileIcon.jsx'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../../hooks/useIsMobile.js'
import Input from '../../common/ui/Input.jsx'
import { validateForm } from '../../../utils/validation/validator.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import MobileCard from './MobileCard.jsx'

// Map backend transaction data → frontend row format
const mapTransactions = (transactions, mode) => {
    if (!transactions) return []

    if (mode === 'create') {
        let frontendId = 1
        return transactions.map(item => ({
            ...item,
            transactionId: item.transactionId || frontendId++,
        }))
    }

    return transactions.map((tx, index) => ({
        transactionId: tx.transaction_id || `temp-${index}-${Date.now()}`,
        transaction_date: tx.transaction_date,
        travel_from: tx.travel_from,
        travel_to: tx.travel_to,
        distance_km: tx.distance_km,
        meter_km: tx.meter_km,
        parking_amount: tx.parking_amount,
        mileage_rate: tx.mileage_rate,
        total_amount: tx.total_amount,
        buyer: tx.buyer,
        attachment: tx.receipts
            ? tx.receipts.map(r => ({
                url: `${API_BASE_URL}/storage/${r.file_path}`,
                name: r.file_name,
                receipt_id: r.receipt_id,
            }))
            : [],
    }))
}

function MileageDataTable({ data, mode, onTransactionsUpdate, toastRef, onClaimUpdated, mileageRate }) {
    const { t } = useTranslation()
    const isMobile = useIsMobile()

    const [rows, setRows] = useState(() => mapTransactions(data, mode))
    const [editingRows, setEditingRows] = useState({})
    const [pendingDeletions, setPendingDeletions] = useState([])
    const internalUpdate = useRef(false)

    useEffect(() => {
        if (internalUpdate.current) {
            internalUpdate.current = false
            return
        }
        setRows(mapTransactions(data, mode))
    }, [data, mode])

    // ─── Helpers ─────────────────────────────────────────────────
    const formatCurrency = (amount) =>
        new Intl.NumberFormat(APP_SETTINGS.currency.locale, {
            style: 'currency',
            currency: APP_SETTINGS.currency.code,
        }).format(amount || 0)

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        return typeof dateStr === 'string' ? dateStr.substring(0, 10) : String(dateStr)
    }

    const syncUp = (updated) => {
        internalUpdate.current = true
        setRows(updated)
        if (onTransactionsUpdate) onTransactionsUpdate(updated)
    }

    // ─── Inline row edit complete ────────────────────────────────
    const onRowEditComplete = (e) => {
        const { newData, index } = e
        const { isValid, errors: validationErrors } = validateForm(newData, validationSchemas.mileageTransaction)
        if (!isValid) {
            const messages = Object.values(validationErrors).map(key => t(key)).join(', ')
            showToast(toastRef, { severity: 'error', summary: t('toast.error'), detail: messages, life: 5000 })
            return
        }
        const rate = parseFloat(newData.mileage_rate || mileageRate) || 0
        const total =
            (parseFloat(newData.distance_km) || 0) * rate +
            (parseFloat(newData.parking_amount) || 0) +
            (parseFloat(newData.meter_km) || 0)

        const updated = [...rows]
        updated[index] = { ...newData, total_amount: parseFloat(total.toFixed(2)) }

        if (mode === 'edit') {
            const tx = updated[index]
            const formData = new FormData()
            formData.append('_method', 'PUT')
            formData.append('transaction_date', tx.transaction_date)
            formData.append('distance_km', tx.distance_km)
            formData.append('meter_km', tx.meter_km ?? '')
            formData.append('parking_amount', tx.parking_amount ?? '')
            formData.append('buyer', tx.buyer ?? '')
            formData.append('travel_from', tx.travel_from ?? '')
            formData.append('travel_to', tx.travel_to ?? '')

            api.post(`mileage-transactions/${tx.transactionId}`, formData)
                .then(() => {
                    showToast(toastRef, { severity: 'success', summary: t('toast.success'), detail: t('mileage.updated', 'Mileage updated') })
                    if (onClaimUpdated) onClaimUpdated()
                })
                .catch(() => {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error'), detail: t('mileage.updateFailed', 'Failed to update') })
                })
        }

        syncUp(updated)
    }

    // ─── Receipt handling ────────────────────────────────────────
    const handleReceiptUpload = async (transactionId, e) => {
        const selectedFiles = Array.from(e.target.files)
        if (!selectedFiles.length) return

        if (mode === 'create') {
            const newFiles = selectedFiles.map(file => ({
                file,
                url: URL.createObjectURL(file),
                name: file.name,
                isNew: true,
            }))
            const updated = rows.map(tx => {
                if (tx.transactionId !== transactionId) return tx
                return { ...tx, attachment: [...(tx.attachment || []), ...newFiles] }
            })
            syncUp(updated)
        } else if (mode === 'edit') {
            const formData = new FormData()
            formData.append('_method', 'PUT')
            selectedFiles.forEach(file => formData.append('files[]', file))
            try {
                await api.post(`mileage-transactions/${transactionId}`, formData)
                showToast(toastRef, { severity: 'success', summary: t('toast.success'), detail: t('mileage.receiptUploaded', 'Receipt uploaded') })
                if (onClaimUpdated) onClaimUpdated()
            } catch {
                showToast(toastRef, { severity: 'error', summary: t('toast.error'), detail: t('mileage.receiptUploadFailed', 'Failed to upload receipt') })
            }
        }
    }

    const handleReceiptRemove = async (transactionId, fileIndex) => {
        if (mode === 'create') {
            const updated = rows.map(tx => {
                if (tx.transactionId !== transactionId) return tx
                const fileToRemove = (tx.attachment || [])[fileIndex]
                if (fileToRemove?.url?.startsWith('blob:')) URL.revokeObjectURL(fileToRemove.url)
                return { ...tx, attachment: (tx.attachment || []).filter((_, i) => i !== fileIndex) }
            })
            syncUp(updated)
        } else if (mode === 'edit') {
            const tx = rows.find(r => r.transactionId === transactionId)
            const file = tx?.attachment?.[fileIndex]
            if (file?.receipt_id) {
                const formData = new FormData()
                formData.append('_method', 'PUT')
                formData.append('deleteReceiptIds', String(file.receipt_id))
                try {
                    await api.post(`mileage-transactions/${transactionId}`, formData)
                    showToast(toastRef, { severity: 'success', summary: t('toast.success'), detail: t('mileage.receiptDeleted', 'Receipt removed') })
                    if (onClaimUpdated) onClaimUpdated()
                } catch {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error'), detail: t('mileage.receiptDeleteFailed', 'Failed to remove receipt') })
                }
            }
        }
    }

    // ─── Transaction delete ──────────────────────────────────────
    const deleteTransaction = (transactionId) => {
        setRows(prev => {
            const txToDelete = prev.find(tx => tx.transactionId === transactionId)
            if (txToDelete) setPendingDeletions(p => [...p, txToDelete])
            const remaining = prev.filter(tx => tx.transactionId !== transactionId)
            internalUpdate.current = true
            if (onTransactionsUpdate) onTransactionsUpdate(remaining)
            return remaining
        })
    }

    const triggerConfirmDeletions = () => {
        confirmDialog({
            message: mode === 'create'
                ? t('mileage.removeItemsMessage', `Remove ${pendingDeletions.length} mileage item(s)?`)
                : t('mileage.deleteItemsMessage', `Permanently delete ${pendingDeletions.length} mileage item(s)?`),
            header: t('mileage.deleteItems', 'Delete Items'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: handleConfirmDeletions,
        })
    }

    const handleConfirmDeletions = async () => {
        try {
            if (mode === 'edit') {
                await Promise.all(pendingDeletions.map(item => api.delete(`mileage-transactions/${item.transactionId}`)))
            }
            setPendingDeletions([])
            if (onClaimUpdated && mode === 'edit') onClaimUpdated()
            showToast(toastRef, { severity: 'success', summary: t('toast.success'), detail: t('mileage.itemsDeleted', 'Items deleted') })
        } catch {
            showToast(toastRef, { severity: 'error', summary: t('toast.error'), detail: t('mileage.deleteFailed', 'Failed to delete') })
        }
    }

    const handleCancelDeletions = () => {
        const restored = [...rows, ...pendingDeletions]
        syncUp(restored)
        setPendingDeletions([])
        showToast(toastRef, { severity: 'info', summary: t('toast.info'), detail: t('mileage.deletionCancelled', 'Deletion cancelled') })
    }

    // ─── Column editor templates ─────────────────────────────────
    const dateEditor = (options) => (
        <InputText
            type="date"
            value={options.value ? options.value.substring(0, 10) : ''}
            onChange={(e) => options.editorCallback(e.target.value)}
            className="w-full text-sm"
        />
    )

    const numberEditor = (options) => (
        <InputNumber
            value={options.value}
            onValueChange={(e) => options.editorCallback(e.value)}
            mode="decimal"
            minFractionDigits={0}
            maxFractionDigits={2}
            className="w-full text-sm"
        />
    )

    const textEditor = (options) => (
        <InputText
            value={options.value || ''}
            onChange={(e) => options.editorCallback(e.target.value)}
            className="w-full text-sm"
        />
    )

    // ─── Column body templates ───────────────────────────────────
    const receiptTemplate = (rowData) => {
        const attachments = rowData.attachment || []
        const isEditing = !!editingRows[rowData.transactionId]
        return (
            <div className="flex flex-col gap-1.5">
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {attachments.map((att, i) => {
                            const fileName = att.file ? att.file.name : (att.name || 'Attachment')
                            const fileType = att.file ? att.file.type : 'application/octet-stream'
                            const fileUrl = att.url || att.path
                            return (
                                <div key={i} className="flex items-center gap-1 text-sm leading-tight">
                                    <span className="shrink-0 [&_svg]:mr-0">{getFileIcon(fileType)}</span>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline truncate max-w-[120px]"
                                        title={fileName}
                                    >
                                        {fileName}
                                    </a>
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={() => handleReceiptRemove(rowData.transactionId, i)}
                                            className="shrink-0 text-red-500 hover:text-red-700 cursor-pointer ml-0.5"
                                        >
                                            <i className="pi pi-times text-xs" />
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
                {isEditing && (
                    <label className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 cursor-pointer w-fit">
                        <i className="pi pi-upload text-xs" />
                        <span>{t('components.upload', 'Upload')}</span>
                        <input
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={(e) => handleReceiptUpload(rowData.transactionId, e)}
                            className="hidden"
                        />
                    </label>
                )}
                {attachments.length === 0 && !isEditing && (
                    <span className="text-gray-400 text-sm">—</span>
                )}
            </div>
        )
    }

    const deleteTemplate = (rowData) => (
        <button
            onClick={() => deleteTransaction(rowData.transactionId)}
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
            <i className="pi pi-trash text-gray-600 hover:text-red-500 transition-colors" />
        </button>
    )

    // ─── Mobile card edit save ───────────────────────────────────
    const saveMobileEdit = (transactionId, draft) => {
        const rate = parseFloat(draft.mileage_rate || mileageRate) || 0
        const total =
            (parseFloat(draft.distance_km) || 0) * rate +
            (parseFloat(draft.parking_amount) || 0) +
            (parseFloat(draft.meter_km) || 0)

        const idx = rows.findIndex(r => r.transactionId === transactionId)
        if (idx === -1) return

        const updated = [...rows]
        updated[idx] = { ...draft, total_amount: parseFloat(total.toFixed(2)) }

        if (mode === 'edit') {
            const tx = updated[idx]
            const formData = new FormData()
            formData.append('_method', 'PUT')
            formData.append('transaction_date', tx.transaction_date)
            formData.append('distance_km', tx.distance_km)
            formData.append('meter_km', tx.meter_km ?? '')
            formData.append('parking_amount', tx.parking_amount ?? '')
            formData.append('buyer', tx.buyer ?? '')
            formData.append('travel_from', tx.travel_from ?? '')
            formData.append('travel_to', tx.travel_to ?? '')

            api.post(`mileage-transactions/${tx.transactionId}`, formData)
                .then(() => {
                    showToast(toastRef, { severity: 'success', summary: t('toast.success'), detail: t('mileage.updated', 'Mileage updated') })
                    if (onClaimUpdated) onClaimUpdated()
                })
                .catch(() => {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error'), detail: t('mileage.updateFailed', 'Failed to update') })
                })
        }

        syncUp(updated)
    }


    const total = rows.reduce((sum, tx) => sum + (parseFloat(tx.total_amount) || 0), 0)

    // ─── Render ──────────────────────────────────────────────────
    return (
        <div className="bg-white h-full p-3 md:p-6">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 className="text-lg md:text-[22px] font-semibold">{t('mileage.title', 'Mileage')}</h3>
                <div className="flex items-center gap-3">
                    {pendingDeletions.length > 0 && (
                        <div className="flex items-center gap-2 animate-fadeIn">
                            <Button icon="pi pi-check" rounded text severity="success" onClick={triggerConfirmDeletions} type="button" />
                            <Button icon="pi pi-times" rounded text severity="danger" onClick={handleCancelDeletions} type="button" />
                            <span className="text-sm text-red-500 font-medium">({pendingDeletions.length} {t('mileage.toDelete', 'to delete')})</span>
                        </div>
                    )}
                    <div className="text-sm text-gray-600">
                        {rows.length} {rows.length === 1 ? t('mileage.item', 'item') : t('mileage.items', 'items')} •{' '}
                        {t('claims.total', 'Total')}: {formatCurrency(total)}
                    </div>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">{t('mileage.noMileage', 'No mileage transactions')}</p>
                    <p className="text-sm">
                        {mode === 'create'
                            ? t('mileage.addFirstMileage', 'Add your first mileage transaction above.')
                            : t('mileage.noMileageItems', 'No mileage transactions recorded.')}
                    </p>
                </div>
            ) : isMobile ? (
                <div>
                    {rows.map(tx => <MobileCard key={tx.transactionId} tx={tx} mode={mode} formatDate={formatDate} formatCurrency={formatCurrency} saveMobileEdit={saveMobileEdit} handleReceiptRemove={handleReceiptRemove} handleReceiptUpload={handleReceiptUpload} deleteTransaction={deleteTransaction} />)}
                </div>
            ) : (
                <DataTable
                    value={rows}
                    dataKey="transactionId"
                    editMode="row"
                    editingRows={editingRows}
                    onRowEditChange={(e) => setEditingRows(e.data)}
                    onRowEditComplete={onRowEditComplete}
                    size="small"
                    scrollable
                    tableStyle={{ minWidth: '60rem' }}
                    emptyMessage={t('mileage.noMileage', 'No mileage transactions')}
                >
                    <Column
                        field="transaction_date"
                        header={t('mileage.transactionDate', 'Date')}
                        body={(row) => formatDate(row.transaction_date)}
                        editor={mode !== 'view' ? dateEditor : undefined}
                        style={{ minWidth: '130px' }}
                    />
                    <Column
                        field="travel_from"
                        header={t('mileage.travelFrom', 'Travel From')}
                        body={(row) => row.travel_from || '—'}
                        editor={mode !== 'view' ? textEditor : undefined}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="travel_to"
                        header={t('mileage.travelTo', 'Travel To')}
                        body={(row) => row.travel_to || '—'}
                        editor={mode !== 'view' ? textEditor : undefined}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="distance_km"
                        header={t('mileage.distance', 'Distance (km)')}
                        editor={mode !== 'view' ? numberEditor : undefined}
                        style={{ minWidth: '110px' }}
                    />
                    <Column
                        field="meter_km"
                        header={t('mileage.meter', 'Meter ($)')}
                        body={(row) => formatCurrency(row.meter_km)}
                        editor={mode !== 'view' ? numberEditor : undefined}
                        style={{ minWidth: '100px' }}
                    />
                    <Column
                        field="parking_amount"
                        header={t('mileage.parking', 'Parking ($)')}
                        body={(row) => formatCurrency(row.parking_amount)}
                        editor={mode !== 'view' ? numberEditor : undefined}
                        style={{ minWidth: '110px' }}
                    />
                    <Column
                        field="buyer"
                        header={t('mileage.buyer', 'Buyer')}
                        body={(row) => row.buyer || '—'}
                        editor={mode !== 'view' ? textEditor : undefined}
                        style={{ minWidth: '100px' }}
                    />
                    <Column
                        field="total_amount"
                        header={t('mileage.totalAmount', 'Amount')}
                        body={(row) => <span className="font-semibold text-brand-primary">{formatCurrency(row.total_amount)}</span>}
                        style={{ minWidth: '100px' }}
                    />
                    <Column
                        header={t('mileage.receipt', 'Receipt')}
                        body={receiptTemplate}
                        style={{ minWidth: '180px' }}
                    />
                    {mode !== 'view' && (
                        <Column
                            rowEditor
                            headerStyle={{ width: '5rem' }}
                            bodyStyle={{ textAlign: 'center' }}
                        />
                    )}
                    {mode !== 'view' && (
                        <Column
                            body={deleteTemplate}
                            header={t('common.delete', 'Delete')}
                            style={{ width: '70px' }}
                        />
                    )}
                </DataTable>
            )}
        </div>
    )
}

export default MileageDataTable
