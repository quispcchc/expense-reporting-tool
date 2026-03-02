import { useTranslation } from 'react-i18next'
import Input from '../../../common/ui/Input.jsx'
import MileageReceiptList from './MileageReceiptList.jsx'

function MileageTransactionTable({ transactions, isEditing, rate, totalKm, mileageTotal, getTransactionReceipts, onUpdateTransaction, onReceiptUpload, onReceiptRemove }) {
    const { t } = useTranslation()

    return (
        <div className="hidden md:block overflow-x-auto">
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
                    {transactions.map((tx, idx) => {
                        const receipts = getTransactionReceipts(tx)
                        return (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-4 py-2 text-gray-800">
                                    {isEditing ? (
                                        <Input name={`tx_date_${idx}`} type="date" value={tx.transaction_date?.substring(0, 10) || ''} onChange={(e) => onUpdateTransaction(idx, 'transaction_date', e.target.value)} />
                                    ) : tx.transaction_date?.substring(0, 10)}
                                </td>
                                <td className="px-4 py-2 text-gray-700">
                                    {isEditing ? (
                                        <Input name={`tx_travel_from_${idx}`} value={tx.travel_from || ''} onChange={(e) => onUpdateTransaction(idx, 'travel_from', e.target.value)} />
                                    ) : (tx.travel_from || '—')}
                                </td>
                                <td className="px-4 py-2 text-gray-700">
                                    {isEditing ? (
                                        <Input name={`tx_travel_to_${idx}`} value={tx.travel_to || ''} onChange={(e) => onUpdateTransaction(idx, 'travel_to', e.target.value)} />
                                    ) : (tx.travel_to || '—')}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-700">
                                    {isEditing ? (
                                        <Input name={`tx_distance_${idx}`} type="number" value={tx.distance_km ?? ''} onChange={(e) => onUpdateTransaction(idx, 'distance_km', e.target.value)} />
                                    ) : parseFloat(tx.distance_km || 0).toFixed(1)}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-700">
                                    ${parseFloat(tx.mileage_rate || rate || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-700">
                                    {isEditing ? (
                                        <Input name={`tx_meter_${idx}`} type="number" value={tx.meter_km ?? ''} onChange={(e) => onUpdateTransaction(idx, 'meter_km', e.target.value)} />
                                    ) : `$${parseFloat(tx.meter_km || 0).toFixed(2)}`}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-700">
                                    {isEditing ? (
                                        <Input name={`tx_parking_${idx}`} type="number" value={tx.parking_amount ?? ''} onChange={(e) => onUpdateTransaction(idx, 'parking_amount', e.target.value)} />
                                    ) : `$${parseFloat(tx.parking_amount || 0).toFixed(2)}`}
                                </td>
                                <td className="px-4 py-2 text-gray-700">
                                    {isEditing ? (
                                        <Input name={`tx_buyer_${idx}`} value={tx.buyer || ''} onChange={(e) => onUpdateTransaction(idx, 'buyer', e.target.value)} />
                                    ) : (tx.buyer || '—')}
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-blue-700">
                                    ${parseFloat(tx.total_amount || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-2">
                                    <div className="flex flex-col gap-1">
                                        <MileageReceiptList receipts={receipts} isEditing={isEditing} txIndex={idx} onUpload={onReceiptUpload} onRemove={onReceiptRemove} />
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
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
    )
}

export default MileageTransactionTable
