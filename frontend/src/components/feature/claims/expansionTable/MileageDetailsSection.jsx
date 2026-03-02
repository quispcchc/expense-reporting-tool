import { useTranslation } from 'react-i18next'
import { API_BASE_URL } from '../../../../api/api.js'
import Input from '../../../common/ui/Input.jsx'
import MileageTransactionCard from './MileageTransactionCard.jsx'
import MileageTransactionTable from './MileageTransactionTable.jsx'

function MileageDetailsSection({ mileage, isEditing, rowData, handleInputChange }) {
    const { t } = useTranslation()

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
        <div className="mt-3 rounded-xl overflow-hidden border border-blue-200 shadow-sm max-w-5xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 sm:px-4 py-3 space-y-2">
                {/* Title row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                            <i className="pi pi-car text-blue-600 text-sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-blue-900">
                                {t('mileage.boundMileage', 'Mileage Details')}
                            </p>
                            <p className="text-xs text-blue-500">
                                {mileage.transactions.length} {t('mileage.trips', 'trips')} · {totalKm.toFixed(1)} km
                                {rate ? ` · $${parseFloat(rate).toFixed(2)}/km` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-wider text-blue-400">{t('claims.total', 'Total')}</p>
                        <p className="text-base font-bold text-blue-700">${mileageTotal.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden p-2 space-y-3">
                {mileage.transactions.map((tx, idx) => (
                    <MileageTransactionCard
                        key={idx}
                        tx={tx}
                        idx={idx}
                        isEditing={isEditing}
                        rate={rate}
                        receipts={getTransactionReceipts(tx)}
                        onUpdateTransaction={updateMileageTransaction}
                        onReceiptUpload={handleMileageReceiptUpload}
                        onReceiptRemove={handleMileageReceiptRemove}
                    />
                ))}
                {/* Mobile totals */}
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <i className="pi pi-map text-blue-500 text-sm" />
                        <span className="text-sm font-semibold text-gray-700">{totalKm.toFixed(1)} km</span>
                    </div>
                    <span className="text-base font-bold text-blue-700">${mileageTotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Desktop table */}
            <MileageTransactionTable
                transactions={mileage.transactions}
                isEditing={isEditing}
                rate={rate}
                totalKm={totalKm}
                mileageTotal={mileageTotal}
                getTransactionReceipts={getTransactionReceipts}
                onUpdateTransaction={updateMileageTransaction}
                onReceiptUpload={handleMileageReceiptUpload}
                onReceiptRemove={handleMileageReceiptRemove}
            />
        </div>
    )
}

export default MileageDetailsSection
