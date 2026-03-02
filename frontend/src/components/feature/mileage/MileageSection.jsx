import React, { useState } from 'react'
import MileageHeaderForm from './MileageHeaderForm.jsx'
import MileageTransactionForm from './MileageTransactionForm.jsx'
import MileageDataTable from './MileageDataTable.jsx'
import { useTranslation } from 'react-i18next'
import { VIEW_MODE } from '../../../config/constants.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'

let nextTransactionId = 1

function MileageSection({ mileageData, setMileageData, mileageRate, toastRef, headerErrors = {} }) {
    const { t } = useTranslation()
    const [localHeaderErrors, setLocalHeaderErrors] = useState({})

    const handleHeaderChange = (updatedHeader) => {
        setMileageData(prev => ({
            ...prev,
            ...updatedHeader,
        }))
        // Clear local errors for fields being changed
        if (Object.keys(localHeaderErrors).length > 0) {
            const cleared = { ...localHeaderErrors }
            Object.keys(updatedHeader).forEach(key => { delete cleared[key] })
            setLocalHeaderErrors(cleared)
        }
    }

    const validateHeader = () => {
        const headerValidation = validateForm(
            { period_of_from: mileageData.period_of_from, period_of_to: mileageData.period_of_to },
            validationSchemas.mileageHeader,
        )
        setLocalHeaderErrors(headerValidation.isValid ? {} : headerValidation.errors)
        return headerValidation.isValid
    }

    const handleAddTransaction = (transaction) => {
        const id = `new-${nextTransactionId++}-${Date.now()}`
        setMileageData(prev => ({
            ...prev,
            transactions: [...(prev.transactions || []), {
                ...transaction,
                transactionId: id,
            }],
        }))
    }

    const handleTransactionsUpdate = (updatedTransactions) => {
        setMileageData(prev => ({
            ...prev,
            transactions: updatedTransactions,
        }))
    }

    const mileageTotal = (mileageData.transactions || []).reduce(
        (sum, tx) => sum + (parseFloat(tx.total_amount) || 0),
        0,
    )

    return (
        <div className="bg-white rounded-2xl shadow-sm mt-6 overflow-hidden">
            <div className="flex justify-between items-center sm:flex-wrap flex-nowrap rounded-t-2xl p-4 md:p-6 bg-brand-light gap-2">
                <div className="flex-1 min-w-0 pr-2">
                    <p className="text-lg sm:text-xl font-semibold text-text-primary whitespace-nowrap sm:whitespace-normal overflow-hidden text-ellipsis">{t('mileage.addMileage', 'Add Mileage')}</p>
                    <p className="text-text-secondary text-xs sm:text-sm hidden sm:block">{t('mileage.addMileageDescription', 'Add mileage details for travel reimbursement')}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-text-secondary">{t('mileage.mileageTotal', 'Mileage Total')}</p>
                    <p className="text-2xl font-bold text-brand-primary">${mileageTotal.toFixed(2)}</p>
                    {mileageRate && (
                        <p className="text-xs text-gray-400">{t('mileage.rate', 'Rate')}: ${parseFloat(mileageRate).toFixed(2)}/km</p>
                    )}
                </div>
            </div>

            <div className="p-4 md:p-6">
                <MileageHeaderForm
                    mileageHeader={{
                        period_of_from: mileageData.period_of_from || '',
                        period_of_to: mileageData.period_of_to || '',
                    }}
                    onHeaderChange={handleHeaderChange}
                    errors={{ ...headerErrors, ...localHeaderErrors }}
                />

                <MileageTransactionForm
                    mileageRate={mileageRate}
                    onAddTransaction={handleAddTransaction}
                    validateHeader={validateHeader}
                />
            </div>

            <MileageDataTable
                data={mileageData.transactions || []}
                mode={VIEW_MODE.CREATE}
                onTransactionsUpdate={handleTransactionsUpdate}
                toastRef={toastRef}
                mileageRate={mileageRate}
            />
        </div>
    )
}

export default MileageSection
