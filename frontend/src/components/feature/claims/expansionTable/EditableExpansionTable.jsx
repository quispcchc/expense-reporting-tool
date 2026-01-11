import React, { useEffect, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import ClaimRowExpansion from './ClaimRowExpansion.jsx'
import { useClaims } from '../../../../contexts/ClaimContext.jsx'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import StatusTab from '../../../common/ui/StatusTab.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'
import { showToast } from '../../../../utils/helpers.js'
import api, { API_BASE_URL } from '../../../../api/api.js'
import { BUTTON_STYLE } from '../../../../utils/customizeStyle.js'
import { confirmDialog } from 'primereact/confirmdialog'

// Helper function to map data based on mode
const mapExpenseData = (data, mode) => {
    if (!data) return []

    if (mode === 'create') {
        let frontendId = 1
        // Create mode: data is already in frontend form shape
        return data.map(item => ({
            ...item,
            transactionId: item.transactionId || frontendId++,
        }))

    } else if (mode === 'edit' || mode === 'view') {
        // Map backend fields to frontend form fields
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
        }))
    }
    return []
}

function EditableExpansionTable({ data, curClaim, mode, onClaimItemsUpdate, toastRef, onClaimUpdated }) {
    const [expenseItems, setExpenseItems] = useState(() => mapExpenseData(data, mode))

    const { updateClaim } = useClaims()

    const [expandedRows, setExpandedRows] = useState(null)

    const [currentlyEditingRowId, setCurrentlyEditingRowId] = useState(null)

    const [originalExpenseData, setOriginalExpenseData] = useState({})

    const [unsavedExpansionChanges, setUnsavedExpansionChanges] = useState({})



    const [pendingDeletions, setPendingDeletions] = useState([]) // Store items waiting to be permanently deleted

    const { lookups: { accountNums, costCentres } } = useLookups()

    useEffect(() => {
        if (!data) return
        setExpenseItems(mapExpenseData(data, mode))
    }, [data, mode])

    const handleExpansionFieldChange = (expenseId, fieldName, newValue) => {
        // For tags, handle special processing
        let processedValue = newValue;
        if (fieldName === 'tags' && newValue && typeof newValue === 'string') {
            processedValue = newValue.split(',').map(tag => tag.trim());
        }

        // For deletedReceiptIds, accumulate values across multiple deletions
        if (fieldName === 'deletedReceiptIds') {
            const existing = unsavedExpansionChanges[expenseId]?.deletedReceiptIds || []
            const incoming = Array.isArray(newValue) ? newValue : [newValue]
            processedValue = [...existing, ...incoming]
        }

        console.log(`📝 handleExpansionFieldChange: expenseId=${expenseId}, fieldName=${fieldName}, newValue=`, newValue)

        // Update the local expense items immediately for UI responsiveness
        setExpenseItems(previousItems =>
            previousItems.map(expense =>
                expense.transactionId === expenseId
                    ? {
                        ...expense,
                        [fieldName]: fieldName === 'tags' ? [...newValue.split(',')] : newValue,
                    }
                    : expense,
            ),
        )

        // Store the changes temporarily until the row edit is completed
        setUnsavedExpansionChanges(previousChanges => {
            const updated = {
                ...previousChanges,
                [expenseId]: {
                    ...previousChanges[expenseId],
                    [fieldName]: fieldName === 'tags' ? [...newValue.split(',')] : processedValue,
                },
            }
            console.log(`✅ Updated unsavedExpansionChanges for ${expenseId}:`, updated[expenseId])
            return updated
        })
    }

    const saveExpenseItemsToParent = (updatedExpenseItems) => {
        // Update local state first
        setExpenseItems(updatedExpenseItems)

        if (mode === 'create' && onClaimItemsUpdate) {
            // In create mode: notify parent component of changes
            onClaimItemsUpdate(updatedExpenseItems)

        }
    }

    const renderExpansionContent = (rowData) => {
        return (
            <ClaimRowExpansion
                rowData={rowData}
                editingRowId={currentlyEditingRowId}
                claimItems={expenseItems}
                expandedRowData={unsavedExpansionChanges}
                handleInputChange={handleExpansionFieldChange}
                mode={mode}
            />
        )
    }

    // Handle starting to edit a row
    const handleRowEditStart = (editEvent) => { // Was: onRowEditInit

        // Only show warning if NOT in create mode AND status is not pending (1)
        if (mode !== 'create' && editEvent.data.status !== 1) {
            confirmDialog({
                message: 'Do you want to edit an expense which has already been approved or rejected?',
                header: 'Edit Expense',
                icon: 'pi pi-info-circle',
                defaultFocus: 'reject',
                rejectClassName: 'p-button-danger',
                accept: () => {
                    setCurrentlyEditingRowId(editEvent.data.transactionId)
                    // Save original data when starting edit
                    const expenseIndex = expenseItems.findIndex(e => e.transactionId === editEvent.data.transactionId)
                    if (expenseIndex >= 0) {
                        setOriginalExpenseData(prev => ({
                            ...prev,
                            [editEvent.data.transactionId]: { ...expenseItems[expenseIndex] }
                        }))
                    }
                    // Clear any existing unsaved changes for this row when starting fresh
                    setUnsavedExpansionChanges(previousChanges => {
                        const cleanedChanges = { ...previousChanges }
                        delete cleanedChanges[editEvent.data.transactionId]
                        return cleanedChanges
                    })
                },
                reject: () => {
                    showToast(toastRef, { severity: 'info', summary: 'Info', detail: 'Edit cancelled' })
                },
            })

        }
        //
        setCurrentlyEditingRowId(editEvent.data.transactionId)

        // Save original data when starting edit
        const expenseIndex = expenseItems.findIndex(e => e.transactionId === editEvent.data.transactionId)
        if (expenseIndex >= 0) {
            setOriginalExpenseData(prev => ({
                ...prev,
                [editEvent.data.transactionId]: { ...expenseItems[expenseIndex] }
            }))
        }

        // Clear any existing unsaved changes for this row when starting fresh
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[editEvent.data.transactionId]
            return cleanedChanges
        })
    }

    // Handle canceling row edit
    const handleRowEditCancel = (editEvent) => {
        const expenseId = editEvent.data.transactionId
        setCurrentlyEditingRowId(null)

        // Restore the original data for this row
        setExpenseItems(previousItems => {
            const restoredItems = [...previousItems]
            const originalExpense = expenseItems.find(expense => expense.transactionId === expenseId)
            if (originalExpense) {
                restoredItems[editEvent.index] = { ...originalExpense }
            }
            return restoredItems
        })

        // Clear any unsaved expansion changes for this row
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[expenseId]
            return cleanedChanges
        })

        showToast(toastRef, { severity: 'info', summary: 'Info', detail: 'Edit cancelled!' })
    }

    // Handle saving row edit
    const handleRowSaveComplete = async (editEvent) => {
        const updatedExpenseItems = [...expenseItems]
        const expenseId = editEvent.newData.transactionId
        const changesFromExpansion = unsavedExpansionChanges[expenseId] || {}

        console.log('=== SAVE ROW EDIT START ===')
        console.log('expenseId:', expenseId)
        console.log('changesFromExpansion:', changesFromExpansion)

        // Merge the row edits with any expansion area changes
        const updated = updatedExpenseItems[editEvent.index] = {
            ...expenseItems[editEvent.index],
            ...editEvent.newData,
            ...changesFromExpansion,
        }

        console.log(updated)

        const updatedExpense = {
            buyer_name: updated.buyer,
            vendor_name: updated.vendor,
            expense_amount: updated.amount,
            transaction_date: updated.transactionDate,
            transaction_desc: updated.description,
            transaction_notes: updated.notes,
            approval_status_id: updated.status,
            project_id: updated.program,
            cost_centre_id: updated.costCentre,
            account_number_id: updated.accountNum,
            tags: Array.isArray(updated.tags)
                ? (typeof updated.tags[0] === 'string'
                    ? updated.tags.join(',')
                    : updated.tags.map(tag => tag.tag_name).join(','))
                : ''
        }

        setCurrentlyEditingRowId(null)

        // Use FormData to support file uploads
        const formData = new FormData()
        Object.keys(updatedExpense).forEach(key => {
            formData.append(key, updatedExpense[key])
        })

        // Handle attachments and deleted receipts
        const deletedReceiptIds = updated.deletedReceiptIds || []
        const newAttachments = updated.attachment || []

        console.log('🔍 Processing attachments:')
        console.log('  newAttachments:', newAttachments)
        console.log('  deletedReceiptIds from form:', deletedReceiptIds)

        // Append new files
        newAttachments.forEach((att, index) => {
            if (att?.file instanceof File) {
                console.log(`  Appending new file [${index}]:`, att.file.name)
                formData.append(`files[${index}]`, att.file)
            }
        })

        // Append deleted receipt IDs (supports array, string, or single number)
        if (Array.isArray(deletedReceiptIds) && deletedReceiptIds.length > 0) {
            console.log('  Appending deleteReceiptIds[] items:', deletedReceiptIds)
            // Append both array form and comma string for maximum compatibility
            deletedReceiptIds.forEach(id => formData.append('deleteReceiptIds[]', String(id)))
            const receiptIdsStr = deletedReceiptIds.join(',')
            formData.append('deleteReceiptIds', receiptIdsStr)
            console.log('  Appending deleteReceiptIds (string):', receiptIdsStr)
        } else {
            const receiptIdsStr = (deletedReceiptIds ?? '').toString()
            if (receiptIdsStr.length > 0) {
                console.log('  Appending deleteReceiptIds:', receiptIdsStr)
                formData.append('deleteReceiptIds', receiptIdsStr)
            }
        }

        // If attachments were explicitly cleared in expansion area, signal full deletion
        const hasAttachmentChange = Object.prototype.hasOwnProperty.call(changesFromExpansion, 'attachment')
        const deleteAll = hasAttachmentChange && newAttachments.length === 0 && deletedReceiptIds.length === 0
        if (deleteAll) {
            console.log('  Appending deleteAttachment: true (clear all)')
            formData.append('deleteAttachment', 'true')
        }

        // Laravel PUT workaround: add _method field to make POST work as PUT
        formData.append('_method', 'PUT')

        // Debug: log FormData contents to verify payload
        try {
            for (const [k, v] of formData.entries()) {
                console.log('  FormData entry:', k, v)
            }
        } catch (e) {
            console.log('  FormData logging failed:', e)
        }

        const response = await api.post(`expenses/${expenseId}`, formData)
        console.log('✅ PUT request successful for expense', expenseId)

        // Sync attachments and tags from backend response
        const serverExpense = response?.data
        if (serverExpense) {
            const mappedReceipts = Array.isArray(serverExpense.receipts)
                ? serverExpense.receipts.map(r => ({
                    url: `${API_BASE_URL}/storage/${r.receipt_path}`,
                    name: r.receipt_name,
                    receipt_id: r.receipt_id,
                }))
                : []
            updatedExpenseItems[editEvent.index] = {
                ...updatedExpenseItems[editEvent.index],
                attachment: mappedReceipts,
                tags: serverExpense.tags || updatedExpenseItems[editEvent.index].tags,
            }
        }

        // Clear the temporary expansion changes for this row
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[expenseId]
            return cleanedChanges
        })

        // Save all changes to parent
        saveExpenseItemsToParent(updatedExpenseItems)
        showToast(toastRef, { severity: 'success', summary: 'Updated', detail: 'Updated successfully!' })
    }

    // Delete an expense item (Soft Delete)
    const deleteExpenseItem = (transactionId) => {
        // Find the item to delete
        const itemToDelete = expenseItems.find(item => item.transactionId === transactionId)

        if (itemToDelete) {
            // Add to pending deletions
            setPendingDeletions(prev => [...prev, itemToDelete])

            // Remove from current view
            setExpenseItems(currentItems => {
                const updatedItems = currentItems.filter(item => item.transactionId !== transactionId)
                saveExpenseItemsToParent(updatedItems)
                return updatedItems
            })
        }
    }

    // Trigger Final Confirmation
    const triggerConfirmDeletions = () => {
        confirmDialog({
            message: mode === 'create'
                ? `Are you sure you want to remove these ${pendingDeletions.length} items from the list?`
                : `Are you sure you want to delete these ${pendingDeletions.length} items permanently? This action cannot be undone.`,
            header: mode === 'create' ? 'Remove Items' : 'Delete Items',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: mode === 'create' ? 'Yes, Remove' : 'Yes, Delete',
            rejectLabel: 'Cancel',
            acceptClassName: 'p-button-danger',
            accept: handleConfirmDeletions,
        })
    }

    // Execute Final Deletion (Backend API Call)
    const handleConfirmDeletions = async () => {
        try {
            // Process all pending deletions
            const deletePromises = pendingDeletions.map(async (item) => {
                // Only call API if in edit mode (where we have real backend IDs)
                if (mode === 'edit' && item.transactionId) {
                    await api.delete(`expenses/${item.transactionId}`)
                }
            })

            await Promise.all(deletePromises)

            // Success - Clear pending list
            setPendingDeletions([])

            // Notify parent to refresh data if needed
            if (onClaimUpdated && mode === 'edit') onClaimUpdated()

            showToast(toastRef, { severity: 'success', summary: 'Success', detail: 'Items deleted permanently' })

        } catch (error) {
            console.error('Batch Delete failed:', error)
            showToast(toastRef, { severity: 'error', summary: 'Error', detail: 'Failed to delete some items' })

            // Optional: You might want to restore items if they failed, 
            // but for now we assume partial success or user will refresh.
        }
    }

    // Cancel Deletion (Restore Items)
    const handleCancelDeletions = () => {
        // Restore items back to the list
        setExpenseItems(prev => {
            const restored = [...prev, ...pendingDeletions]
            // Optional: Sort logic could be added here if order matters
            saveExpenseItemsToParent(restored)
            return restored
        })

        // Clear pending list
        setPendingDeletions([])
        showToast(toastRef, { severity: 'info', summary: 'Info', detail: 'Deletion cancelled, items restored' })
    }

    // Render delete button for each row
    const renderDeleteButton = (rowData) => {
        const isCurrentlyEditing = currentlyEditingRowId === rowData.transactionId

        return (
            <button
                onClick={() => deleteExpenseItem(rowData.transactionId)}
                type="button"
                className="p-2 disabled:opacity-50"
                title="Delete this expense"
                disabled={isCurrentlyEditing}
            >
                <i className="pi pi-trash"></i>
            </button>
        )
    }

    // Display template for currency amounts
    const renderCurrencyAmount = (rowData) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(rowData.amount || 0)
    }

    // Approve and Reject a single expense item
    async function approveExpense(expenseId) {
        try {
            await api.post(`expenses/${expenseId}/approve`)

            // Update local state in table
            setExpenseItems(prev =>
                prev.map(item =>
                    item.transactionId === expenseId ? { ...item, status: 2 } : item,
                ),
            )
            if (onClaimUpdated) onClaimUpdated()

            showToast(toastRef, { severity: 'success', summary: 'Success', detail: 'Approved successfully!' })

        }
        catch (error) {
            console.log(error)
            showToast(
                toastRef, { severity: 'error', summary: 'Error', detail: 'Ops, something went wrong!' })
        }
    }

    async function rejectExpense(expenseId) {
        try {

            await api.post(`expenses/${expenseId}/reject`)

            // update local state
            setExpenseItems(prev =>
                prev.map(item =>
                    item.transactionId === expenseId ? { ...item, status: 3 } : item,
                ),
            )

            if (onClaimUpdated) onClaimUpdated()

            showToast(toastRef, { severity: 'success', summary: 'Success', detail: 'Rejected successfully!' })
        }
        catch (error) {
            console.log(error)
        }
    }

    const renderActionsButton = (rowData) => {
        const isProcessed = rowData.status === 2 || rowData.status === 3 // 2=Approved, 3=Rejected

        return (
            <div className="flex gap-2">
                <Button label="Approve" outlined className={BUTTON_STYLE.success} icon="pi pi-check" iconPos="right"
                    onClick={() => approveExpense(rowData.transactionId)} disabled={isProcessed} />
                <Button label="Reject" outlined className={BUTTON_STYLE.danger} icon="pi pi-times" iconPos="right"
                    onClick={() => rejectExpense(rowData.transactionId)} disabled={isProcessed} />
            </div>
        )
    }

    const renderStatus = (rowData) => (
        <StatusTab status={rowData.status} />
    )

    // Convert ID to label
    const accountNumMap = Object.fromEntries(
        accountNums.map(opt => [opt.account_number_id, `${opt.account_number} - ${opt.description}`]),
    )

    const costCentreMap = Object.fromEntries(
        costCentres.map(opt => [opt.cost_centre_id, `${opt.cost_centre_code} - ${opt.description}`]),
    )

    // Editor templates for inline editing
    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

    const accountNumEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={accountNums.map((opt) => ({
                label: `${opt.account_number} - ${opt.description}`,
                value: opt.account_number_id,
            }))}
        />

    )

    const costCentreEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={costCentres.map((opt) => ({
                label: `${opt.cost_centre_code} - ${opt.description}`,
                value: opt.cost_centre_id,
            }))}
        />

    )

    const currencyInputEditor = (editorOptions) => (
        <InputNumber
            value={editorOptions.value}
            onValueChange={(e) => editorOptions.editorCallback(e.value)}
            mode="currency"
            currency="USD"
            locale="en-US"
            className="w-full"
        />
    )

    const dateInputEditor = (editorOptions) => (
        <InputText
            type="date"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

    return (
        <div className="bg-white h-full p-6">



            {/* Expenses Header*/}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-[22px] font-semibold">Expense Details</h3>

                    {/* deferred deletion control buttons */}
                    {pendingDeletions.length > 0 && (
                        <div className="flex items-center gap-2 animate-fadeIn">
                            <Button
                                icon="pi pi-check"
                                rounded
                                text
                                severity="success"
                                aria-label="Confirm Delete"
                                onClick={triggerConfirmDeletions}
                                tooltip="Confirm Deletion"
                                type="button"
                            />
                            <Button
                                icon="pi pi-times"
                                rounded
                                text
                                severity="danger"
                                aria-label="Cancel Delete"
                                onClick={handleCancelDeletions}
                                tooltip="Cancel Deletion"
                                type="button"
                            />
                            <span className="text-sm text-red-500 font-medium">
                                ({pendingDeletions.length} to delete)
                            </span>
                        </div>
                    )}
                </div>

                <div className="text-sm text-gray-600">

                    <div className="text-sm text-gray-600">
                        {expenseItems.length} {expenseItems.length === 1 ? 'item' : 'items'} •
                        Total: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                        }).format(expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                    </div>
                </div>
            </div>

            {/*Expenses Table*/}
            {expenseItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No expenses added yet</p>
                    <p className="text-sm">
                        {mode === 'create'
                            ? 'Add your first expense using the form above.'
                            : 'This claim contains no expense items.'
                        }
                    </p>
                </div>
            ) : (
                <DataTable
                    // Data & Identity
                    value={expenseItems}
                    dataKey="transactionId"

                    // Row editing event handlers
                    editMode="row"
                    onRowEditInit={handleRowEditStart}
                    onRowEditCancel={handleRowEditCancel}
                    onRowEditComplete={handleRowSaveComplete}

                    // Row Expansion
                    expandedRows={expandedRows}
                    onRowToggle={(e) => setExpandedRows(e.data)}
                    rowExpansionTemplate={renderExpansionContent}

                    // Pagination
                    paginator
                    rows={5}
                    rowsPerPageOptions={[10, 25, 50]}

                    //  Appearance & Behavior
                    tableStyle={{ minWidth: '50rem' }}
                    emptyMessage="No expense items to display"
                    size="small"
                >
                    <Column expander />
                    <Column
                        field="transactionId"
                        header="ID"
                    />
                    <Column
                        field="transactionDate"
                        header="Transaction Date"
                        editor={dateInputEditor}
                        style={{ minWidth: '150px' }}
                    />

                    <Column
                        field="vendor"
                        header="Vendor"
                        editor={textInputEditor}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="accountNum"
                        header="Account #"
                        editor={accountNumEditor}
                        body={(rowData) => accountNumMap[rowData.accountNum] || ''}
                        style={{ minWidth: '200px' }}
                    />

                    <Column
                        field="costCentre"
                        header="Cost Centre"
                        editor={costCentreEditor}
                        body={(rowData) => costCentreMap[rowData.costCentre] || ''}
                        style={{ minWidth: '200px' }}
                    />
                    <Column
                        field="amount"
                        header="Amount"
                        body={renderCurrencyAmount}
                        editor={currencyInputEditor}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="buyer"
                        header="Buyer"
                        editor={textInputEditor}
                        style={{ minWidth: '120px' }}
                    />

                    {mode !== 'create' &&
                        <Column
                            field="status"
                            header="Status"
                            body={renderStatus}
                            style={{ minWidth: '120px' }}
                        />
                    }

                    {mode !== 'view' &&
                        <Column
                            rowEditor={true}
                            header="Edit"
                        />
                    }

                    {mode !== 'view' && <Column
                        body={renderDeleteButton}
                        header="Delete"
                    />
                    }

                    {mode === 'edit' && (
                        <Column
                            body={renderActionsButton}
                            header="Action"
                        />
                    )}
                </DataTable>
            )
            }
        </div>
    )

}

export default EditableExpansionTable