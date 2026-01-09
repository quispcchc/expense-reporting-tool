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

function EditableExpansionTable ({ data, curClaim, mode, onClaimItemsUpdate, toastRef, onClaimUpdated }) {
    const [expenseItems, setExpenseItems] = useState(data || [])

    const { updateClaim } = useClaims()

    const [expandedRows, setExpandedRows] = useState(null)

    const [currentlyEditingRowId, setCurrentlyEditingRowId] = useState(null)

    const [originalExpenseData, setOriginalExpenseData] = useState({})

    const [unsavedExpansionChanges, setUnsavedExpansionChanges] = useState({})

    const { lookups: { accountNums, costCentres } } = useLookups()

    useEffect(() => {
        if (!data) return

        if (mode === 'create') {
            let frontendId = 1
            // Create mode: data is already in frontend form shape, no mapping needed
            setExpenseItems(data.map(item => ( {
                ...item,
                transactionId: frontendId++,
            } )))

        } else {

            // Map backend fields to frontend form fields
            setExpenseItems(
                data.map(expense => {
                    // Map all receipts to attachments array (supports multiple)
                                        const attachments = Array.isArray(expense.receipts) && expense.receipts.length > 0
                        ? expense.receipts.map(r => ({
                            url: `${API_BASE_URL}/storage/${r.receipt_path}`,
                            file: null,
                            name: r.receipt_name,
                            path: r.receipt_path,
                            receipt_id: r.receipt_id,
                          }))
                        : [];

                                        console.log('[Map] expense', expense.expense_id, 'receipts:', expense.receipts ? expense.receipts.length : 0, '→ attachments:', attachments.length)

                    return {
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
                        attachment: attachments, // maintain property name for compatibility
                    };
                }),
            )
        }
    }, [data])

    const handleExpansionFieldChange = (expenseId, fieldName, newValue) => {
        // For tags, handle special processing
        let processedValue = newValue;
        if (fieldName === 'tags' && newValue && typeof newValue === 'string') {
            processedValue = newValue.split(',').map(tag => tag.trim());
        }

        // Update the local expense items immediately for UI responsiveness
        setExpenseItems(previousItems =>
            previousItems.map(expense =>
                expense.transactionId === expenseId
                    ? {
                        ...expense,
                        [ fieldName ]: processedValue,
                    }
                    : expense,
            ),
        )

        // Store the changes temporarily until the row edit is completed
        setUnsavedExpansionChanges(previousChanges => ( {
            ...previousChanges,
            [ expenseId ]: {
                ...previousChanges[ expenseId ],
                [ fieldName ]: processedValue,
            },
        } ))
    }

    const saveExpenseItemsToParent = (updatedExpenseItems) => {
        // Update local state first
        setExpenseItems(updatedExpenseItems)

        if (mode === 'create' && onClaimItemsUpdate) {
            // In create mode: notify parent component of changes
            onClaimItemsUpdate(updatedExpenseItems)

        } else
            if (mode === 'edit' && curClaim && updateClaim) {
                // In edit mode: update the claim in global context
                const recalculatedTotal = updatedExpenseItems.reduce(
                    (totalAmount, expense) => totalAmount + ( parseFloat(expense.amount) || 0 ),
                    0,
                )
                updateClaim({
                    ...curClaim,
                    claimItems: updatedExpenseItems,
                    totalAmount: recalculatedTotal,
                })

            }
    }

    const renderExpansionContent = (rowData) => {
        return (
            <ClaimRowExpansion
                rowData={ rowData }
                editingRowId={ currentlyEditingRowId }
                claimItems={ expenseItems }
                expandedRowData={ unsavedExpansionChanges }
                handleInputChange={ handleExpansionFieldChange }
                mode={ mode }
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
                        delete cleanedChanges[ editEvent.data.transactionId ]
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
            delete cleanedChanges[ editEvent.data.transactionId ]
            return cleanedChanges
        })
    }

// Handle canceling row edit
    const handleRowEditCancel = (editEvent) => {
        const expenseId = editEvent.data.transactionId
        setCurrentlyEditingRowId(null)

        // Restore the original data for this row from saved state
        const originalExpense = originalExpenseData[expenseId]
        if (originalExpense) {
            setExpenseItems(previousItems => {
                const restoredItems = [...previousItems]
                const expenseIndex = restoredItems.findIndex(e => e.transactionId === expenseId)
                if (expenseIndex >= 0) {
                    restoredItems[expenseIndex] = { ...originalExpense }
                }
                return restoredItems
            })
        }

        // Clear original expense data
        setOriginalExpenseData(prev => {
            const updated = { ...prev }
            delete updated[expenseId]
            return updated
        })

        // Clear any unsaved expansion changes for this row
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[ expenseId ]
            return cleanedChanges
        })

        showToast(toastRef, { severity: 'info', summary: 'Info', detail: 'Edit cancelled!' })
    }

// Handle saving row edit
    const handleRowSaveComplete = async(editEvent) => {
        const updatedExpenseItems = [...expenseItems]
        const expenseId = editEvent.newData.transactionId
        const expenseIndex = editEvent.index
        const changesFromExpansion = unsavedExpansionChanges[ expenseId ] || {}
        const originalExpense = originalExpenseData[expenseId] || expenseItems[expenseIndex]

        console.log('=== SAVE ROW EDIT START ===')
        console.log('expenseId:', expenseId)
        console.log('changesFromExpansion:', changesFromExpansion)
        console.log('originalExpense (saved):', originalExpense)

        // Merge the row edits with any expansion area changes
        const updated = updatedExpenseItems[ expenseIndex ] = {
            ...expenseItems[ expenseIndex ],
            ...editEvent.newData,
            ...changesFromExpansion,
        }

        console.log('merged updated:', updated)

        // Create FormData for request
        const formData = new FormData()
        formData.append('buyer_name', updated.buyer || '')
        formData.append('vendor_name', updated.vendor || '')
        formData.append('expense_amount', updated.amount || '')
        formData.append('transaction_date', updated.transactionDate || '')
        formData.append('transaction_desc', updated.description || '')
        formData.append('transaction_notes', updated.notes || '')
        formData.append('approval_status_id', updated.status || '')
        formData.append('project_id', updated.program || '')
        formData.append('cost_centre_id', updated.costCentre || '')
        formData.append('account_number_id', updated.accountNum || '')
        
        const tagsValue = Array.isArray(updated.tags)
            ? (typeof updated.tags[0] === 'string'
                ? updated.tags.join(',')
                : updated.tags.map(tag => tag.tag_name).join(','))
            : ''
        formData.append('tags', tagsValue)
        
        // Handle multiple attachments - use ORIGINAL expense data
        const originalAttachments = Array.isArray(originalExpense?.attachment) 
            ? originalExpense.attachment 
            : (originalExpense?.attachment ? [originalExpense.attachment] : [])
        
        const updatedAttachments = Array.isArray(updated.attachment) 
            ? updated.attachment 
            : (updated.attachment ? [updated.attachment] : [])
        
        console.log('originalAttachments (from saved):', originalAttachments)
        console.log('updatedAttachments:', updatedAttachments)
        
        // Find deleted receipts (original receipts that are not in updated)
        const deletedReceiptIds = originalAttachments
            .filter(original => original.receipt_id) // Only existing receipts have receipt_id
            .filter(original => !updatedAttachments.some(updated => 
                updated.receipt_id && updated.receipt_id === original.receipt_id
            ))
            .map(r => r.receipt_id)
        
        if (deletedReceiptIds.length > 0) {
            console.log('🗑️ MARKING RECEIPTS FOR DELETION:', deletedReceiptIds)
            formData.append('deleteReceiptIds', deletedReceiptIds.join(','))
        }
        
        // Delete ALL if updated is empty (backward compatibility)
        if (originalAttachments.length > 0 && updatedAttachments.length === 0) {
            console.log('🗑️ MARKING ALL FOR DELETION')
            formData.append('deleteAttachment', 'true')
        }

        // Find new files to upload (files with isNew flag or File instance)
        const newFiles = updatedAttachments.filter(attachment => 
            attachment.isNew || attachment.file instanceof File
        )

        if (newFiles.length > 0) {
            console.log('📎 APPENDING NEW FILES:', newFiles.length)
            newFiles.forEach((attachment) => {
                if (attachment.file instanceof File) {
                    // Use files[] so Laravel treats it as an array
                    formData.append('files[]', attachment.file)
                }
            })
        }
        
        // Laravel requires _method field for PUT with multipart/form-data
        formData.append('_method', 'PUT')
        
        // Log FormData contents
        console.log('FormData contents:')
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value)
        }

        setCurrentlyEditingRowId(null)
        
        // Clear original expense data
        setOriginalExpenseData(prev => {
            const updated = { ...prev }
            delete updated[expenseId]
            return updated
        })
        
        try {
            console.log('🚀 Sending POST request (method spoofing PUT) to expenses/' + expenseId)
            // Use POST with _method=PUT for multipart/form-data
            await api.post(`expenses/${ expenseId }`, formData)
            console.log('✅ POST request successful')
            if (onClaimUpdated) onClaimUpdated()
        } catch (error) {
            console.error('❌ POST request failed:', error)
            throw error
        }

        // Clear the temporary expansion changes for this row
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[ expenseId ]
            return cleanedChanges
        })

        // Save all changes to parent
        saveExpenseItemsToParent(updatedExpenseItems)
        showToast(toastRef, { severity: 'success', summary: 'Updated', detail: 'Updated successfully!' })
        console.log('=== SAVE ROW EDIT END ===')
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
                onClick={ () => deleteExpenseItem(rowData.transactionId) }
                type="button"
                className="p-2 disabled:opacity-50"
                title="Delete this expense"
                disabled={ isCurrentlyEditing }
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
    async function approveExpense (expenseId) {
        try {
            await api.post(`expenses/${ expenseId }/approve`)

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

    async function rejectExpense (expenseId) {
        try {

            await api.post(`expenses/${ expenseId }/reject`)

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
                <Button label="Approve" outlined className={ BUTTON_STYLE.success } icon="pi pi-check" iconPos="right"
                        onClick={ () => approveExpense(rowData.transactionId) } disabled={ isProcessed }/>
                <Button label="Reject" outlined className={ BUTTON_STYLE.danger } icon="pi pi-times" iconPos="right"
                        onClick={ () => rejectExpense(rowData.transactionId) } disabled={ isProcessed }/>
            </div>
        )
    }

    const renderStatus = (rowData) => (
        <StatusTab status={ rowData.status }/>
    )

// Convert ID to label
    const accountNumMap = Object.fromEntries(
        accountNums.map(opt => [opt.account_number_id, `${ opt.account_number } - ${ opt.description }`]),
    )

    const costCentreMap = Object.fromEntries(
        costCentres.map(opt => [opt.cost_centre_id, `${ opt.cost_centre_code } - ${ opt.description }`]),
    )

// Editor templates for inline editing
    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={ editorOptions.value || '' }
            onChange={ (e) => editorOptions.editorCallback(e.target.value) }
            className="w-full"
        />
    )

    const accountNumEditor = (editorOptions) => (
        <Dropdown
            value={ editorOptions.value }
            onChange={ (e) => editorOptions.editorCallback(e.target.value) }
            options={ accountNums.map((opt) => ( {
                label: `${ opt.account_number } - ${ opt.description }`,
                value: opt.account_number_id,
            } )) }
        />

    )

    const costCentreEditor = (editorOptions) => (
        <Dropdown
            value={ editorOptions.value }
            onChange={ (e) => editorOptions.editorCallback(e.target.value) }
            options={ costCentres.map((opt) => ( {
                label: `${ opt.cost_centre_code } - ${ opt.description }`,
                value: opt.cost_centre_id,
            } )) }
        />

    )

    const currencyInputEditor = (editorOptions) => (
        <InputNumber
            value={ editorOptions.value }
            onValueChange={ (e) => editorOptions.editorCallback(e.value) }
            mode="currency"
            currency="USD"
            locale="en-US"
            className="w-full"
        />
    )

    const dateInputEditor = (editorOptions) => (
        <InputText
            type="date"
            value={ editorOptions.value || '' }
            onChange={ (e) => editorOptions.editorCallback(e.target.value) }
            className="w-full"
        />
    )

    return (
        <div className="bg-white h-full p-6">

            {/* Expenses Header*/ }
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[22px] font-semibold">Expense Details</h3>

                <div className="text-sm text-gray-600">
                    { expenseItems.length } { expenseItems.length === 1 ? 'item' : 'items' } •
                    Total: { new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(expenseItems.reduce((sum, item) => sum + ( parseFloat(item.amount) || 0 ), 0)) }
                </div>
            </div>

            {/*Expenses Table*/ }
            { expenseItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No expenses added yet</p>
                    <p className="text-sm">
                        { mode === 'create'
                            ? 'Add your first expense using the form above.'
                            : 'This claim contains no expense items.'
                        }
                    </p>
                </div>
            ) : (
                <DataTable
                    // Data & Identity
                    value={ expenseItems }
                    dataKey="transactionId"

                    // Row editing event handlers
                    editMode="row"
                    onRowEditInit={ handleRowEditStart }
                    onRowEditCancel={ handleRowEditCancel }
                    onRowEditComplete={ handleRowSaveComplete }

                    // Row Expansion
                    expandedRows={ expandedRows }
                    onRowToggle={ (e) => setExpandedRows(e.data) }
                    rowExpansionTemplate={ renderExpansionContent }

                    // Pagination
                    paginator
                    rows={ 5 }
                    rowsPerPageOptions={ [10, 25, 50] }

                    //  Appearance & Behavior
                    tableStyle={ { minWidth: '50rem' } }
                    emptyMessage="No expense items to display"
                    size="small"
                >
                    <Column expander/>
                    <Column
                        field="transactionId"
                        header="ID"
                    />
                    <Column
                        field="transactionDate"
                        header="Transaction Date"
                        editor={ dateInputEditor }
                        style={ { minWidth: '150px' } }
                    />

                    <Column
                        field="vendor"
                        header="Vendor"
                        editor={ textInputEditor }
                        style={ { minWidth: '120px' } }
                    />
                    <Column
                        field="accountNum"
                        header="Account #"
                        editor={ accountNumEditor }
                        body={ (rowData) => accountNumMap[ rowData.accountNum ] || '' }
                        style={ { minWidth: '200px' } }
                    />

                    <Column
                        field="costCentre"
                        header="Cost Centre"
                        editor={ costCentreEditor }
                        body={ (rowData) => costCentreMap[ rowData.costCentre ] || '' }
                        style={ { minWidth: '200px' } }
                    />
                    <Column
                        field="amount"
                        header="Amount"
                        body={ renderCurrencyAmount }
                        editor={ currencyInputEditor }
                        style={ { minWidth: '120px' } }
                    />
                    <Column
                        field="buyer"
                        header="Buyer"
                        editor={ textInputEditor }
                        style={ { minWidth: '120px' } }
                    />

                    { mode !== 'create' &&
                        <Column
                            field="status"
                            header="Status"
                            body={ renderStatus }
                            style={ { minWidth: '120px' } }
                        />
                    }

                    { mode !== 'view' &&
                        <Column
                            rowEditor={ true }
                            header="Edit"
                        />
                    }

                    { mode !== 'view' && <Column
                        body={ renderDeleteButton }
                        header="Delete"
                    />
                    }

                    { mode === 'edit' && (
                        <Column
                            body={ renderActionsButton }
                            header="Action"
                        />
                    ) }
                </DataTable>
            )
            }
        </div>
    )

}

export default EditableExpansionTable