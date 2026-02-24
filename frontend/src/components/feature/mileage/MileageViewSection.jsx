import React from 'react'
import MileageDataTable from './MileageDataTable.jsx'
import MileageHeaderForm from './MileageHeaderForm.jsx'
import { useTranslation } from 'react-i18next'

function MileageViewSection({ mileage, mode, toastRef, onClaimUpdated }) {
    const { t } = useTranslation()

    if (!mileage) return null

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        return dateStr.substring(0, 10)
    }

    const mileageTotal = (mileage.transactions || []).reduce(
        (sum, tx) => sum + (parseFloat(tx.total_amount) || 0), 0,
    )

    return (
        <div className="bg-white rounded-2xl shadow-sm mt-6">
            {/* Header bar */}
            <div className="flex justify-between items-center flex-wrap rounded-t-2xl p-4 md:p-6 bg-brand-light gap-2">
                <div>
                    <p className="text-xl font-semibold text-text-primary">{t('mileage.title', 'Mileage')}</p>
                    <p className="text-text-secondary text-sm">
                        {formatDate(mileage.period_of_from)} → {formatDate(mileage.period_of_to)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-text-secondary">{t('mileage.mileageTotal', 'Mileage Total')}</p>
                    <p className="text-2xl font-bold text-brand-primary">${mileageTotal.toFixed(2)}</p>
                </div>
            </div>

            {/* Mileage transactions table */}
            <MileageDataTable
                data={mileage.transactions || []}
                mode={mode}
                toastRef={toastRef}
                onClaimUpdated={onClaimUpdated}
                mileageRate={mileage.transactions?.[0]?.mileage_rate}
            />
        </div>
    )
}

export default MileageViewSection
