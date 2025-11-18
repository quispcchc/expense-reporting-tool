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

function EditableExpansionTable ({ data, curClaim, mode, onClaimItemsUpdate }) {
    const [expenseItems, setExpenseItems] = useState(data || [])

    const { updateClaim } = useClaims()

    const [expandedRows, setExpandedRows] = useState(null)

    const [currentlyEditingRowId, setCurrentlyEditingRowId] = useState(null)

    const [unsavedExpansionChanges, setUnsavedExpansionChanges] = useState({})

    const { lookups: { accountNums, costCentres } } = useLookups()

    useEffect(() => {
        setExpenseItems(data)
    }, [data])

    const handleExpansionFieldChange = (expenseId, fieldName, newValue) => {
        // Update the local expense items immediately for UI responsiveness
        setExpenseItems(previousItems =>
            previousItems.map(expense =>
                expense.transactionId === expenseId
                    ? {
                        ...expense,
                        [ fieldName ]: fieldName === 'tags' ? [...newValue.split(',')] : newValue,
                    }
                    : expense,
            ),
        )

        // Store the changes temporarily until the row edit is completed
        setUnsavedExpansionChanges(previousChanges => ( {
            ...previousChanges,
            [ expenseId ]: {
                ...previousChanges[ expenseId ],
                [ fieldName ]: fieldName === 'tags' ? [...newValue.split(',')] : newValue,
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
            />
        )
    }

    const handleRowSaveComplete = (editEvent) => {
        const updatedExpenseItems = [...expenseItems]
        const expenseId = editEvent.newData.transactionId
        const changesFromExpansion = unsavedExpansionChanges[ expenseId ] || {}

        // Merge the row edits with any expansion area changes
        updatedExpenseItems[ editEvent.index ] = {
            ...expenseItems[ editEvent.index ],
            ...editEvent.newData,
            ...changesFromExpansion,
        }

        setCurrentlyEditingRowId(null)

        // Clear the temporary expansion changes for this row
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[ expenseId ]
            return cleanedChanges
        })

        // Save all changes to parent
        saveExpenseItemsToParent(updatedExpenseItems)
    }

    // Handle starting to edit a row
    const handleRowEditStart = (editEvent) => { // Was: onRowEditInit
        setCurrentlyEditingRowId(editEvent.data.transactionId)

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

        // Restore the original data for this row
        setExpenseItems(previousItems => {
            const restoredItems = [...previousItems]
            const originalExpense = expenseItems.find(expense => expense.transactionId === expenseId)
            if (originalExpense) {
                restoredItems[ editEvent.index ] = { ...originalExpense }
            }
            return restoredItems
        })

        // Clear any unsaved expansion changes for this row
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[ expenseId ]
            return cleanedChanges
        })

        setCurrentlyEditingRowId(null)
    }

    // Delete an expense item
    const deleteExpenseItem = (transactionId) => {
        setExpenseItems(currentItems => {
            const updatedExpenseItems = currentItems.filter(expense => expense.transactionId !== transactionId)
            saveExpenseItemsToParent(updatedExpenseItems)
            return updatedExpenseItems
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

    const renderActionsButton = (rowData) => ( <div className="flex gap-2">
        <Button label="Approve"/>
        <Button label="Reject"/>
    </div> )

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