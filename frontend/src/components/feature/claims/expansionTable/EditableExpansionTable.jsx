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
import api from '../../../../api/api.js'
import { BUTTON_STYLE } from '../../../../utils/customizeStyle.js'
import { confirmDialog } from 'primereact/confirmdialog'

function EditableExpansionTable({ data, curClaim, mode, onClaimItemsUpdate, toastRef, onClaimUpdated }) {
    const [expenseItems, setExpenseItems] = useState(data || [])

    const { updateClaim } = useClaims()

    const [expandedRows, setExpandedRows] = useState(null)

    const [currentlyEditingRowId, setCurrentlyEditingRowId] = useState(null)

    const [unsavedExpansionChanges, setUnsavedExpansionChanges] = useState({})

    const { lookups: { accountNums, costCentres } } = useLookups()

    useEffect(() => {
        if (!data) return

        if (mode === 'create') {
            let frontendId = 1
            // Create mode: data is already in frontend form shape, no mapping needed
            setExpenseItems(data.map(item => ({
                ...item,
                transactionId: frontendId++,
            })))

        } else if (mode === 'edit') {

            // Map backend fields to frontend form fields
            setExpenseItems(
                data.map(expense => ({
                    transactionId: expense.expense_id,
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
                    attachment: expense.receipts.map(receipt => ({
                        receipt_id: receipt.receipt_id,
                        receipt_name: receipt.receipt_name,
                        receipt_path: receipt.receipt_path,
                        receipt_desc: receipt.receipt_desc
                    }))

                })),
            )
        }
    }, [data])

    const handleExpansionFieldChange = (expenseId, fieldName, newValue) => {
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
        setUnsavedExpansionChanges(previousChanges => ({
            ...previousChanges,
            [expenseId]: {
                ...previousChanges[expenseId],
                [fieldName]: fieldName === 'tags' ? [...newValue.split(',')] : newValue,
            },
        }))
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

        if (editEvent.data.status !== 1) { // 1 for pending
            confirmDialog({
                message: 'Do you want to edit an expense which has already been approved or rejected?',
                header: 'Edit Expense',
                icon: 'pi pi-info-circle',
                defaultFocus: 'reject',
                rejectClassName: 'p-button-danger',
                accept: () => {
                    setCurrentlyEditingRowId(editEvent.data.transactionId)
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

        console.log('changes', changesFromExpansion)

        // Merge the row edits with any expansion area changes
        const updated = updatedExpenseItems[editEvent.index] = {
            ...expenseItems[editEvent.index],
            ...editEvent.newData,
            ...changesFromExpansion,
        }

        console.log('updated', updated)

        // Prepare FormData to handle file uploads
        const formData = new FormData()
        
        // Add regular fields
        formData.append('buyer_name', updated.buyer)
        formData.append('vendor_name', updated.vendor)
        formData.append('expense_amount', updated.amount)
        formData.append('transaction_date', updated.transactionDate)
        formData.append('transaction_desc', updated.description)
        formData.append('transaction_notes', updated.notes)
        formData.append('approval_status_id', updated.status)
        formData.append('project_id', updated.program)
        formData.append('cost_centre_id', updated.costCentre)
        formData.append('account_number_id', updated.accountNum)
        formData.append('tags', Array.isArray(updated.tags)
            ? (typeof updated.tags[0] === 'string'
                ? updated.tags.join(',')
                : updated.tags.map(tag => tag.tag_name).join(','))
            : '')

        // Track deleted receipts (those with receipt_id but removed from list)
        const deletedReceiptIds = []
        
        const originalAttachment = editEvent.newData.attachment
        console.log('originalAttachment', originalAttachment)
        if (Array.isArray(originalAttachment)) {
            const currentReceiptIds = new Set(
                updated.attachment
                    .filter(att => att.receipt_id)
                    .map(att => att.receipt_id)
            )
            
            originalAttachment.forEach(att => {
                if (att.receipt_id && !currentReceiptIds.has(att.receipt_id)) {
                    deletedReceiptIds.push(att.receipt_id)
                }
            })
        }

        console.log('deletedReceiptIds', deletedReceiptIds)

        // Add deleted receipt IDs to FormData
        if (deletedReceiptIds.length > 0) {
            formData.append('deleted_receipts', JSON.stringify(deletedReceiptIds))
        }

        // Add new files
        const newFiles = updated.attachment.filter(att => att.file)
        newFiles.forEach((att) => {
            formData.append('file[]', att.file)
        })

        // Add method override for Laravel (POST with _method=PUT for FormData compatibility)
        formData.append('_method', 'PUT')

        // Log FormData contents for debugging
        console.log('FormData being sent:')
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value)
        }

        try {
            setCurrentlyEditingRowId(null)
            if (mode === 'edit') {
                console.log('DEBUG: About to send request with FormData')
                console.log('DEBUG: expenseId =', expenseId)
                console.log('DEBUG: updated object =', updated)
                
                // Test 1: Send as FormData (with _method=PUT)
                const response = await api.post(`expenses/${expenseId}`, formData)
                console.log('Update response:', response.data)
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
        } catch (error) {
            console.error('Error updating expense:', error)
            showToast(toastRef, { 
                severity: 'error', 
                summary: 'Error', 
                detail: error.response?.data?.message || 'Failed to update expense' 
            })
        }
    }

    // Delete an expense item
    const deleteExpenseItem = (transactionId) => {
        confirmDialog({
            message: 'Do you want to delete an expense?',
            header: 'Delete Expense',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            rejectClassName: 'p-button-danger',
            accept: () => setExpenseItems(currentItems => {
                const updatedExpenseItems = currentItems.filter(expense => expense.transactionId !== transactionId)
                saveExpenseItemsToParent(updatedExpenseItems)
                return updatedExpenseItems
            }),
            reject: () => {
                showToast(toastRef, { severity: 'info', summary: 'Info', detail: 'Delete Cancelled' })
            },
        })

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
                <h3 className="text-[22px] font-semibold">Expense Details</h3>

                <div className="text-sm text-gray-600">
                    {expenseItems.length} {expenseItems.length === 1 ? 'item' : 'items'} •
                    Total: {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }).format(expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
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