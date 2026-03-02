import { useState, useCallback, useRef, useEffect } from 'react'
import { validateForm } from '../utils/validation/validator.js'
import { validationSchemas } from '../utils/validation/schemas.js'

/**
 * Hook encapsulating mobile expense edit state and handlers.
 * Manages mobileEditData, mobileEditErrors, and provides
 * start/cancel/save/update functions for mobile expense editing.
 *
 * @param {Object} params
 * @param {Array} params.expenseItems - Current expense items array
 * @param {React.MutableRefObject} params.handleRowSaveCompleteRef - Ref to the save handler
 */
export function useMobileExpenseEdit({ expenseItems, handleRowSaveCompleteRef }) {
    const [mobileEditData, setMobileEditData] = useState(null)
    const [mobileEditErrors, setMobileEditErrors] = useState({})

    // Keep expenseItems in a ref for stable access in callbacks
    const expenseItemsRef = useRef(expenseItems)
    useEffect(() => { expenseItemsRef.current = expenseItems }, [expenseItems])

    const startMobileEdit = useCallback((item) => {
        const editData = {
            transactionId: item.transactionId,
            program: item.program,
            amount: item.amount,
            transactionDate: item.transactionDate,
            vendor: item.vendor,
            buyer: item.buyer,
            accountNum: item.accountNum,
            costCentre: item.costCentre,
            mileage: item.mileage ? {
                ...item.mileage,
                transactions: item.mileage.transactions?.map(tx => ({ ...tx })) || [],
            } : null,
        }
        setMobileEditData(editData)
        setMobileEditErrors({})
    }, [])

    const cancelMobileEdit = useCallback(() => {
        setMobileEditData(null)
        setMobileEditErrors({})
    }, [])

    const saveMobileEdit = useCallback(async () => {
        if (!mobileEditData) return

        // Validate expense fields
        const { isValid, errors: validationErrors } = validateForm(mobileEditData, validationSchemas.expense)

        // Validate mileage transactions
        let hasMileageError = false
        const mileageTxErrors = {}
        if (mobileEditData.mileage?.transactions?.length > 0) {
            for (let i = 0; i < mobileEditData.mileage.transactions.length; i++) {
                const tx = mobileEditData.mileage.transactions[i]
                const { isValid: txValid, errors: errs } = validateForm(tx, validationSchemas.mileageTransaction)
                if (!txValid) {
                    hasMileageError = true
                    mileageTxErrors[i] = errs
                }
            }
        }

        if (!isValid || hasMileageError) {
            setMobileEditErrors({ ...validationErrors, mileageTx: hasMileageError ? mileageTxErrors : undefined })
            return
        }

        const items = expenseItemsRef.current
        const expenseId = mobileEditData.transactionId
        const idx = items.findIndex(e => e.transactionId === expenseId)
        if (idx < 0) return

        // Build a fake editEvent matching handleRowSaveComplete's expected shape
        const editEvent = {
            index: idx,
            newData: {
                ...items[idx],
                ...mobileEditData,
            },
        }
        await handleRowSaveCompleteRef.current(editEvent)
        setMobileEditData(null)
        setMobileEditErrors({})
    }, [mobileEditData, handleRowSaveCompleteRef])

    const updateMobileField = useCallback((field, value) => {
        setMobileEditData(prev => ({ ...prev, [field]: value }))
        setMobileEditErrors(prev => prev[field] ? { ...prev, [field]: undefined } : prev)
    }, [])

    const updateMobileMileageTx = useCallback((txIndex, field, value) => {
        setMobileEditData(prev => {
            const mileage = { ...prev.mileage }
            const transactions = mileage.transactions.map((tx, i) => {
                if (i !== txIndex) return tx
                const updated = { ...tx, [field]: value }
                const r = parseFloat(updated.mileage_rate || mileage.transactions[0]?.mileage_rate) || 0
                updated.total_amount = parseFloat((
                    (parseFloat(updated.distance_km) || 0) * r +
                    (parseFloat(updated.meter_km) || 0) +
                    (parseFloat(updated.parking_amount) || 0)
                ).toFixed(2))
                return updated
            })
            return { ...prev, mileage: { ...mileage, transactions } }
        })
        // Clear specific mileage field error
        setMobileEditErrors(prev => {
            if (!prev.mileageTx?.[txIndex]?.[field]) return prev
            const mileageTx = { ...prev.mileageTx }
            const txErrs = { ...mileageTx[txIndex] }
            delete txErrs[field]
            if (Object.keys(txErrs).length === 0) {
                delete mileageTx[txIndex]
            } else {
                mileageTx[txIndex] = txErrs
            }
            const hasTxErrors = Object.keys(mileageTx).length > 0
            return { ...prev, mileageTx: hasTxErrors ? mileageTx : undefined }
        })
    }, [])

    return {
        mobileEditData,
        mobileEditErrors,
        startMobileEdit,
        cancelMobileEdit,
        saveMobileEdit,
        updateMobileField,
        updateMobileMileageTx,
    }
}
