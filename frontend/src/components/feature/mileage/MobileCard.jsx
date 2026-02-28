import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useTranslation } from 'react-i18next'
import { getFileIcon } from '../claims/uploadAttchment/getFileIcon.jsx'
import Input from '../../common/ui/Input.jsx'
import { validateForm } from '../../../utils/validation/validator.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'

function MobileCard({ tx, mode, formatDate, formatCurrency, saveMobileEdit, handleReceiptRemove, handleReceiptUpload, deleteTransaction }) {
    const { t } = useTranslation()
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(tx)
    const [errors, setErrors] = useState({})

    const handleField = (name, value) => {
        setDraft(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }))
        }
    }

    const handleSave = () => {
        const { isValid, errors: validationErrors } = validateForm(draft, validationSchemas.mileageTransaction)
        if (!isValid) {
            setErrors(validationErrors)
            return
        }
        saveMobileEdit(tx.transactionId, draft)
        setEditing(false)
        setErrors({})
    }

    const handleCancel = () => {
        setDraft(tx)
        setEditing(false)
        setErrors({})
    }

    const attachments = tx.attachment || []

    return (
        <>
            <div className="border border-gray-300 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{formatDate(tx.transaction_date)}</p>
                        <p className="text-xs text-gray-500">
                            {tx.travel_from || '—'} → {tx.travel_to || '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {tx.distance_km} km · {t('mileage.meter', 'Meter')}: {formatCurrency(tx.meter_km)} · {t('mileage.parking', 'Parking')}: {formatCurrency(tx.parking_amount)}
                        </p>
                        <p className="text-xs text-gray-500">{t('mileage.buyer', 'Buyer')}: {tx.buyer || '—'}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-semibold text-brand-primary">{formatCurrency(tx.total_amount)}</p>
                        {mode !== 'view' && (
                            <div className="flex items-center justify-end gap-2 mt-1">
                                <button onClick={() => { setDraft(tx); setEditing(true) }} type="button" className="text-xs text-blue-600 hover:text-blue-800">
                                    <i className="pi pi-pencil text-xs" />
                                </button>
                                <button onClick={() => deleteTransaction(tx.transactionId)} type="button" className="text-xs text-red-500 hover:text-red-700">
                                    <i className="pi pi-trash text-xs" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {attachments.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {attachments.map((att, i) => {
                            const fileName = att.file ? att.file.name : (att.name || 'Attachment')
                            const fileType = att.file ? att.file.type : 'application/octet-stream'
                            const fileUrl = att.url || att.path
                            return (
                                <div key={i} className="flex items-center gap-1 text-sm">
                                    <span className="shrink-0 [&_svg]:mr-0">{getFileIcon(fileType)}</span>
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate" title={fileName}>{fileName}</a>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <Dialog
                header={t('mileage.editTransaction', 'Edit Mileage Transaction')}
                visible={editing}
                style={{ width: '90vw', maxWidth: '450px' }}
                onHide={handleCancel}
                className="mobile-edit-dialog"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={handleCancel} />
                        <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={handleSave} />
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <Input
                        name="travel_from"
                        label={t('mileage.travelFrom', 'Travel From') + '*'}
                        value={draft.travel_from || ''}
                        onChange={e => handleField('travel_from', e.target.value)}
                        errors={errors}
                    />
                    <Input
                        name="travel_to"
                        label={t('mileage.travelTo', 'Travel To') + '*'}
                        value={draft.travel_to || ''}
                        onChange={e => handleField('travel_to', e.target.value)}
                        errors={errors}
                    />
                    <Input
                        name="transaction_date"
                        label={t('mileage.transactionDate', 'Date') + '*'}
                        type="date"
                        value={draft.transaction_date ? String(draft.transaction_date).substring(0, 10) : ''}
                        onChange={e => handleField('transaction_date', e.target.value)}
                        errors={errors}
                    />
                    <Input
                        name="distance_km"
                        inputMode="decimal"
                        label={t('mileage.distance', 'Distance (km)')}
                        value={draft.distance_km ?? ''}
                        onChange={e => handleField('distance_km', e.target.value)}
                        errors={errors}
                    />
                    <Input
                        name="meter_km"
                        label={t('mileage.meter', 'Meter (Max. $5/location)')}
                        inputMode="decimal"
                        value={draft.meter_km ?? ''}
                        onChange={e => handleField('meter_km', e.target.value)}
                        errors={errors}
                    />
                    <Input
                        name="parking_amount"
                        inputMode="decimal"
                        label={t('mileage.parking', 'Parking ($)')}
                        value={draft.parking_amount ?? ''}
                        onChange={e => handleField('parking_amount', e.target.value)}
                        errors={errors}
                    />
                    <Input
                        name="buyer"
                        label={t('mileage.buyer', 'Buyer') + '*'}
                        value={draft.buyer ?? ''}
                        onChange={e => handleField('buyer', e.target.value)}
                        errors={errors}
                    />

                    {/* Receipts */}
                    <div>
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1">
                                {attachments.map((att, i) => {
                                    const fileName = att.file ? att.file.name : (att.name || 'Attachment')
                                    const fileType = att.file ? att.file.type : 'application/octet-stream'
                                    const fileUrl = att.url || att.path
                                    return (
                                        <div key={i} className="flex items-center gap-1 text-sm">
                                            <span className="shrink-0 [&_svg]:mr-0">{getFileIcon(fileType)}</span>
                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[120px]" title={fileName}>{fileName}</a>
                                            <button type="button" onClick={() => handleReceiptRemove(tx.transactionId, i)} className="text-red-500 hover:text-red-700 cursor-pointer ml-0.5">
                                                <i className="pi pi-times text-xs" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <label className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                            <i className="pi pi-upload text-xs" />
                            <span>{t('components.upload', 'Upload')}</span>
                            <input type="file" multiple accept="image/*,application/pdf" onChange={e => handleReceiptUpload(tx.transactionId, e)} className="hidden" />
                        </label>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export default MobileCard
