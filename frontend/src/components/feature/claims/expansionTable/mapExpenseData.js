import { API_BASE_URL } from '../../../../api/api.js'
import { VIEW_MODE } from '../../../../config/constants.js'

/**
 * Maps expense data between backend and frontend shapes based on mode.
 * - 'create': data is already in frontend form shape, just ensures transactionId
 * - 'edit'/'view': maps backend fields to frontend form fields
 */
const mapExpenseData = (data, mode) => {
    if (!data) return []

    if (mode === VIEW_MODE.CREATE) {
        let frontendId = 1
        // Create mode: data is already in frontend form shape
        return data.map(item => ({
            ...item,
            transactionId: item.transactionId || frontendId++,
        }))

    } else if (mode === VIEW_MODE.EDIT || mode === VIEW_MODE.VIEW) {
        // Map backend fields to frontend form fields.
        // Mileage is now per-expense (expense.mileage from the backend).
        return data.map((expense, index) => ({
            transactionId: expense.expense_id || `temp-${index}-${Date.now()}`,
            buyer: expense.buyer_name,
            vendor: expense.vendor_name,
            transactionDate: expense.transaction_date,
            accountNum: expense.account_number_id,
            costCentre: expense.cost_centre_id,
            amount: expense.expense_amount,
            description: expense.transaction_desc,
            notes: expense.transaction_notes,
            tags: expense.tags,
            status: expense.approval_status_id,
            program: expense.project_id,
            attachment: expense.receipts ? expense.receipts.map(receipt => ({
                url: `${API_BASE_URL}/storage/${receipt.receipt_path}`,
                name: receipt.receipt_name,
                receipt_id: receipt.receipt_id,
            })) : [],
            // Each expense carries its own mileage from the backend
            ...(expense.mileage ? { mileage: expense.mileage } : {}),
        }))
    }
    return []
}

export default mapExpenseData
