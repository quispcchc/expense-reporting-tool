import { useTranslation } from 'react-i18next'
import Input from '../../../common/ui/Input.jsx'
import MileageReceiptList from './MileageReceiptList.jsx'

function MileageTransactionCard({ tx, idx, isEditing, rate, receipts, onUpdateTransaction, onReceiptUpload, onReceiptRemove }) {
    const { t } = useTranslation()

    return (
        <div className="rounded-lg border border-blue-100 bg-white shadow-sm overflow-hidden">
            {/* Card header: date + amount badge */}
            <div className="flex items-center justify-between bg-blue-50/70 px-3 py-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-600">{idx + 1}</span>
                    </div>
                    {isEditing ? (
                        <Input name={`tx_date_${idx}`} type="date" value={tx.transaction_date?.substring(0, 10) || ''} onChange={(e) => onUpdateTransaction(idx, 'transaction_date', e.target.value)} />
                    ) : (
                        <span className="text-sm font-medium text-gray-800">{tx.transaction_date?.substring(0, 10) || '—'}</span>
                    )}
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-bold text-blue-700">
                    ${parseFloat(tx.total_amount || 0).toFixed(2)}
                </span>
            </div>

            <div className="px-3 py-2.5 space-y-2.5">
                {/* Route: from → to */}
                <div className="flex items-center gap-2 text-sm">
                    <i className="pi pi-map-marker text-blue-400 text-xs shrink-0" />
                    {isEditing ? (
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <Input name={`tx_travel_from_${idx}`} value={tx.travel_from || ''} placeholder={t('mileage.travelFrom', 'From')} onChange={(e) => onUpdateTransaction(idx, 'travel_from', e.target.value)} />
                            <Input name={`tx_travel_to_${idx}`} value={tx.travel_to || ''} placeholder={t('mileage.travelTo', 'To')} onChange={(e) => onUpdateTransaction(idx, 'travel_to', e.target.value)} />
                        </div>
                    ) : (
                        <span className="text-gray-700">
                            {tx.travel_from || '—'}
                            <i className="pi pi-arrow-right text-[10px] text-gray-400 mx-1.5" />
                            {tx.travel_to || '—'}
                        </span>
                    )}
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">{t('mileage.distance', 'Distance')}</p>
                        {isEditing ? (
                            <Input name={`tx_distance_${idx}`} type="number" value={tx.distance_km ?? ''} onChange={(e) => onUpdateTransaction(idx, 'distance_km', e.target.value)} />
                        ) : (
                            <p className="text-sm font-semibold text-gray-700">{parseFloat(tx.distance_km || 0).toFixed(1)} km</p>
                        )}
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">{t('mileage.rate', 'Rate')}</p>
                        <p className="text-sm font-semibold text-gray-700">${parseFloat(tx.mileage_rate || rate || 0).toFixed(2)}</p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">{t('mileage.buyer', 'Buyer')}</p>
                        {isEditing ? (
                            <Input name={`tx_buyer_${idx}`} value={tx.buyer || ''} onChange={(e) => onUpdateTransaction(idx, 'buyer', e.target.value)} />
                        ) : (
                            <p className="text-sm font-semibold text-gray-700 truncate">{tx.buyer || '—'}</p>
                        )}
                    </div>
                </div>

                {/* Meter + parking */}
                <div className="grid grid-cols-2 gap-1.5">
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">{t('mileage.meter', 'Meter')}</p>
                        {isEditing ? (
                            <Input name={`tx_meter_${idx}`} type="number" value={tx.meter_km ?? ''} onChange={(e) => onUpdateTransaction(idx, 'meter_km', e.target.value)} />
                        ) : (
                            <p className="text-sm font-semibold text-gray-700">${parseFloat(tx.meter_km || 0).toFixed(2)}</p>
                        )}
                    </div>
                    <div className="rounded-md bg-gray-50 px-2 py-1.5 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">{t('mileage.parking', 'Parking')}</p>
                        {isEditing ? (
                            <Input name={`tx_parking_${idx}`} type="number" value={tx.parking_amount ?? ''} onChange={(e) => onUpdateTransaction(idx, 'parking_amount', e.target.value)} />
                        ) : (
                            <p className="text-sm font-semibold text-gray-700">${parseFloat(tx.parking_amount || 0).toFixed(2)}</p>
                        )}
                    </div>
                </div>

                {/* Receipts */}
                {(receipts.length > 0 || isEditing) && (
                    <div className="pt-1 border-t border-gray-100">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t('mileage.receipt', 'Receipts')}</p>
                        <MileageReceiptList receipts={receipts} isEditing={isEditing} txIndex={idx} onUpload={onReceiptUpload} onRemove={onReceiptRemove} />
                    </div>
                )}
                {receipts.length === 0 && !isEditing && (
                    <div className="text-xs text-gray-400 italic">{t('upload.noAttachments', 'No receipts')}</div>
                )}
            </div>
        </div>
    )
}

export default MileageTransactionCard
