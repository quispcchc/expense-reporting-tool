import React, { useEffect, useState, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputNumber } from 'primereact/inputnumber'
import ClaimRowExpansion from './ClaimRowExpansion.jsx'
import { useClaims } from '../../../../contexts/ClaimContext.jsx'
import { Button } from 'primereact/button'
import StatusTab from '../../../common/ui/StatusTab.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'
import { APP_SETTINGS } from '../../../../config/settings.js'
import { showToast } from '../../../../utils/helpers.js'
import api, { API_BASE_URL } from '../../../../api/api.js'
import { BUTTON_STYLE } from '../../../../utils/customizeStyle.js'
import { confirmDialog } from 'primereact/confirmdialog'
import { Dialog } from 'primereact/dialog'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../../../hooks/useIsMobile.js'
import { validateForm } from '../../../../utils/validation/validator.js'
import { validationSchemas } from '../../../../utils/validation/schemas.js'
import Input from '../../../common/ui/Input.jsx'
import Select from '../../../common/ui/Select.jsx'
import { formatCurrency } from '../../../../utils/formatters.js'
import mapExpenseData from './mapExpenseData.js'
import { useMobileExpenseEdit } from './useMobileExpenseEdit.js'
import { expenseTextEditor, accountNumEditor, costCentreEditor, currencyInputEditor, dateInputEditor } from './expenseEditors.jsx'

function EditableExpansionTable({ data, curClaim, mode, onClaimItemsUpdate, toastRef, onClaimUpdated }) {
    const { t } = useTranslation()
    const isMobile = useIsMobile()
    const [expenseItems, setExpenseItems] = useState(() => mapExpenseData(data, mode))
    const [mobileExpandedId, setMobileExpandedId] = useState(null)

    const { updateClaim } = useClaims()

    const [expandedRows, setExpandedRows] = useState(null)

    const [currentlyEditingRowId, setCurrentlyEditingRowId] = useState(null)

    const [originalExpenseData, setOriginalExpenseData] = useState({})

    const [unsavedExpansionChanges, setUnsavedExpansionChanges] = useState({})

    // Use ref to always have access to the latest unsavedExpansionChanges value
    // This is needed because handleRowSaveComplete may be called before React state updates
    const unsavedExpansionChangesRef = useRef({})



    const [pendingDeletions, setPendingDeletions] = useState([]) // Store items waiting to be permanently deleted

    const { lookups, lookups: { accountNums, costCentres } } = useLookups()

    // Ref for handleRowSaveComplete — allows the mobile edit hook to
    // always access the latest version without circular dependency
    const handleRowSaveCompleteRef = useRef(null)

    const {
        mobileEditData, mobileEditErrors,
        startMobileEdit, cancelMobileEdit, saveMobileEdit,
        updateMobileField, updateMobileMileageTx,
    } = useMobileExpenseEdit({ expenseItems, handleRowSaveCompleteRef })

    useEffect(() => {
        if (!data) return
        setExpenseItems(mapExpenseData(data, mode))
    }, [data, mode])

    const handleExpansionFieldChange = (expenseId, fieldName, newValue) => {
        // For tags, handle both string (from text input) and array (from MultiSelect)
        let processedValue = newValue;
        if (fieldName === 'tags') {
            if (Array.isArray(newValue)) {
                processedValue = newValue;
            } else if (typeof newValue === 'string') {
                processedValue = newValue.split(',').map(tag => tag.trim());
            }
        }

        // For deletedReceiptIds, accumulate values across multiple deletions
        if (fieldName === 'deletedReceiptIds') {
            const existing = unsavedExpansionChanges[expenseId]?.deletedReceiptIds || []
            const incoming = Array.isArray(newValue) ? newValue : [newValue]
            processedValue = [...existing, ...incoming]
        }


        // Update the local expense items immediately for UI responsiveness
        // EXCEPT for attachment - that's handled only via unsavedExpansionChanges to prevent duplication
        if (fieldName !== 'attachment' && fieldName !== 'deletedReceiptIds') {
            setExpenseItems(previousItems =>
                previousItems.map(expense =>
                    expense.transactionId === expenseId
                        ? {
                            ...expense,
                            [fieldName]: processedValue,
                        }
                        : expense,
                ),
            )
        }

        // Store the changes temporarily until the row edit is completed
        setUnsavedExpansionChanges(previousChanges => {
            const updated = {
                ...previousChanges,
                [expenseId]: {
                    ...previousChanges[expenseId],
                    [fieldName]: processedValue,
                },
            }
            // Keep ref in sync with state
            unsavedExpansionChangesRef.current = updated
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
                message: t('expenses.editApprovedRejectedMessage', 'Do you want to edit an expense which has already been approved or rejected?'),
                header: t('expenses.editExpense', 'Edit Expense'),
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
                    showToast(toastRef, { severity: 'info', summary: t('toast.info'), detail: t('expenses.editCancelled', 'Edit cancelled') })
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
            unsavedExpansionChangesRef.current = cleanedChanges
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
            unsavedExpansionChangesRef.current = cleanedChanges
            return cleanedChanges
        })

        showToast(toastRef, { severity: 'info', summary: t('toast.info'), detail: t('claims.editCancelled') })
    }

    // Handle saving row edit
    const handleRowSaveComplete = async (editEvent) => {
        const updatedExpenseItems = [...expenseItems]
        const expenseId = editEvent.newData.transactionId
        // Use ref to get the latest changes (React state may not be updated yet)
        const changesFromExpansion = unsavedExpansionChangesRef.current[expenseId] || {}


        // Merge the row edits with any expansion area changes
        const updated = updatedExpenseItems[editEvent.index] = {
            ...expenseItems[editEvent.index],
            ...editEvent.newData,
            ...changesFromExpansion,
        }

        setCurrentlyEditingRowId(null)

        // Restore original row data and clear expansion changes on validation failure
        const restoreOriginalRow = () => {
            const original = originalExpenseData[expenseId]
            if (original) {
                setExpenseItems(prev => prev.map(e => e.transactionId === expenseId ? { ...original } : e))
            }
            setUnsavedExpansionChanges(prev => {
                const cleaned = { ...prev }
                delete cleaned[expenseId]
                unsavedExpansionChangesRef.current = cleaned
                return cleaned
            })
        }

        // Validate expense fields
        const { isValid, errors: validationErrors } = validateForm(updated, validationSchemas.expense)
        if (!isValid) {
            const messages = Object.values(validationErrors).map(key => t(key)).join(', ')
            showToast(toastRef, { severity: 'error', summary: t('common.error'), detail: messages, life: 5000 })
            restoreOriginalRow()
            return
        }

        // Validate mileage transactions if present
        if (updated.mileage?.transactions?.length > 0) {
            let hasMileageError = false
            const txErrors = {}
            for (let i = 0; i < updated.mileage.transactions.length; i++) {
                const tx = updated.mileage.transactions[i]
                const { isValid: txValid, errors: errs } = validateForm(tx, validationSchemas.mileageTransaction)
                if (!txValid) {
                    hasMileageError = true
                    txErrors[i] = errs
                }
            }
            if (hasMileageError) {
                const messages = Object.values(txErrors).flatMap(errs => Object.values(errs).map(key => t(key))).join(', ')
                showToast(toastRef, { severity: 'error', summary: t('common.error'), detail: messages, life: 5000 })
                restoreOriginalRow()
                return
            }
        }

        // In CREATE mode: only update local state, don't send to server
        // The data will be sent when the claim is submitted
        if (mode === 'create') {

            // Clear the temporary expansion changes for this row
            setUnsavedExpansionChanges(previousChanges => {
                const cleanedChanges = { ...previousChanges }
                delete cleanedChanges[expenseId]
                unsavedExpansionChangesRef.current = cleanedChanges
                return cleanedChanges
            })

            // Save all changes to parent
            saveExpenseItemsToParent(updatedExpenseItems)
            showToast(toastRef, { severity: 'success', summary: t('common.success'), detail: t('claims.expenseUpdatedLocally') })
            return
        }

        // EDIT/VIEW mode: send to server
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
                ? updated.tags.map(tag => {
                    if (typeof tag === 'object' && tag.tag_id) return tag.tag_id;
                    if (typeof tag === 'string' && !isNaN(tag)) return Number(tag);
                    return tag;
                })
                : [],
        }

        // Use FormData to support file uploads
        const formData = new FormData()
        Object.keys(updatedExpense).forEach(key => {
            if (key === 'tags' && Array.isArray(updatedExpense.tags)) {
                updatedExpense.tags.forEach(tagId => {
                    formData.append('tags[]', tagId)
                })
            } else {
                formData.append(key, updatedExpense[key])
            }
        })

        // Handle attachments and deleted receipts
        const deletedReceiptIds = updated.deletedReceiptIds || []
        const newAttachments = updated.attachment || []


        // Append new files
        newAttachments.forEach((att, index) => {
            if (att?.file instanceof File) {
                formData.append(`files[${index}]`, att.file)
            }
        })

        // Append deleted receipt IDs (supports array, string, or single number)
        if (Array.isArray(deletedReceiptIds) && deletedReceiptIds.length > 0) {
            // Append both array form and comma string for maximum compatibility
            deletedReceiptIds.forEach(id => formData.append('deleteReceiptIds[]', String(id)))
            const receiptIdsStr = deletedReceiptIds.join(',')
            formData.append('deleteReceiptIds', receiptIdsStr)
        } else {
            const receiptIdsStr = (deletedReceiptIds ?? '').toString()
            if (receiptIdsStr.length > 0) {
                formData.append('deleteReceiptIds', receiptIdsStr)
            }
        }

        // If attachments were explicitly cleared in expansion area, signal full deletion
        const hasAttachmentChange = Object.prototype.hasOwnProperty.call(changesFromExpansion, 'attachment')
        const deleteAll = hasAttachmentChange && newAttachments.length === 0 && deletedReceiptIds.length === 0
        if (deleteAll) {
            formData.append('deleteAttachment', 'true')
        }

        // Laravel PUT workaround: add _method field to make POST work as PUT
        formData.append('_method', 'PUT')

        // Debug: log FormData contents to verify payload
        try {
            for (const [k, v] of formData.entries()) {
            }
        } catch (e) {
        }

        const response = await api.post(`expenses/${expenseId}`, formData)

        // Sync attachments and tags from backend response
        const serverExpense = response?.data
        if (serverExpense) {
            const mappedReceipts = Array.isArray(serverExpense.receipts)
                ? serverExpense.receipts.map(r => ({
                    url: `${API_BASE_URL}/storage/${r.receipt_path}`,
                    name: r.receipt_name,
                    receipt_id: r.receipt_id,
                }))
                : [];
            // Map tag IDs from backend to tag objects for display
            let mappedTags = serverExpense.tags;
            if (Array.isArray(serverExpense.tags)) {
                // Use lookups to map tag IDs to tag objects
                mappedTags = serverExpense.tags.map(tag => {
                    if (typeof tag === 'object' && tag.tag_id && tag.tag_name) {
                        return tag;
                    }
                    // If tag is an ID, find the tag object
                    const found = lookups.tags.find(t => t.tag_id === tag);
                    return found || tag;
                });
            }
            updatedExpenseItems[editEvent.index] = {
                ...updatedExpenseItems[editEvent.index],
                attachment: mappedReceipts,
                tags: mappedTags || updatedExpenseItems[editEvent.index].tags,
            };
        }

        // Clear the temporary expansion changes for this row
        setUnsavedExpansionChanges(previousChanges => {
            const cleanedChanges = { ...previousChanges }
            delete cleanedChanges[expenseId]
            unsavedExpansionChangesRef.current = cleanedChanges
            return cleanedChanges
        })

        // Save mileage header + transactions if mileage was edited
        // Check expansion changes (desktop) or newData.mileage (mobile dialog)
        if (changesFromExpansion.mileage || editEvent.newData?.mileage) {
            const mileage = updated.mileage
            const mileageId = mileage?.mileage_id
            if (mileageId) {
                await api.put(`mileages/${mileageId}`, {
                    travel_from: mileage.travel_from,
                    travel_to: mileage.travel_to,
                    period_of_from: mileage.period_of_from,
                    period_of_to: mileage.period_of_to,
                })
            }
            if (mileage?.transactions?.length) {
                const deletedReceiptIds = mileage._deletedReceiptIds || {}
                await Promise.all(mileage.transactions.map(tx => {
                    const txId = tx.transaction_id || tx.transactionId
                    const newFiles = (tx.attachment || []).filter(a => a.isNew && a.file)
                    const txDeletedIds = deletedReceiptIds[txId] || []
                    const hasFileChanges = newFiles.length > 0 || txDeletedIds.length > 0

                    if (hasFileChanges) {
                        // Use FormData when there are receipt changes
                        const mileageFormData = new FormData()
                        mileageFormData.append('_method', 'PUT')
                        mileageFormData.append('travel_from', tx.travel_from ?? '')
                        mileageFormData.append('travel_to', tx.travel_to ?? '')
                        mileageFormData.append('transaction_date', tx.transaction_date)
                        mileageFormData.append('distance_km', tx.distance_km)
                        mileageFormData.append('meter_km', tx.meter_km ?? '')
                        mileageFormData.append('parking_amount', tx.parking_amount ?? '')
                        mileageFormData.append('buyer', tx.buyer ?? '')
                        
                        newFiles.forEach(f => mileageFormData.append('files[]', f.file))
                        if (txDeletedIds.length > 0) {
                            mileageFormData.append('deleteReceiptIds', txDeletedIds.join(','))
                        }
                        return api.post(`mileage-transactions/${txId}`, mileageFormData)
                    }
                    return api.put(`mileage-transactions/${txId}`, {
                        travel_from: tx.travel_from ?? '',
                        travel_to: tx.travel_to ?? '',  
                        transaction_date: tx.transaction_date,
                        distance_km: tx.distance_km,
                        meter_km: tx.meter_km ?? null,
                        parking_amount: tx.parking_amount ?? null,
                        buyer: tx.buyer ?? null,
                    })
                }))
            }
            if (onClaimUpdated) onClaimUpdated()
        }

        // Save all changes to parent
        saveExpenseItemsToParent(updatedExpenseItems)
        showToast(toastRef, { severity: 'success', summary: t('common.success'), detail: t('claims.updatedSuccessfully') })
    }
    // Keep ref in sync for mobile edit hook
    handleRowSaveCompleteRef.current = handleRowSaveComplete

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
                ? t('expenses.removeItemsMessage', { count: pendingDeletions.length }, `Are you sure you want to remove these ${pendingDeletions.length} items from the list?`)
                : t('expenses.deleteItemsMessage', { count: pendingDeletions.length }, `Are you sure you want to delete these ${pendingDeletions.length} items permanently? This action cannot be undone.`),
            header: mode === 'create' ? t('expenses.removeItems', 'Remove Items') : t('expenses.deleteItems', 'Delete Items'),
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: mode === 'create' ? t('expenses.yesRemove', 'Yes, Remove') : t('expenses.yesDelete', 'Yes, Delete'),
            rejectLabel: t('common.cancel'),
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

            showToast(toastRef, { severity: 'success', summary: t('toast.success'), detail: t('expenses.itemsDeletedPermanently', 'Items deleted permanently') })

        } catch (error) {
            console.error('Batch Delete failed:', error)
            showToast(toastRef, { severity: 'error', summary: t('toast.error'), detail: t('expenses.deleteItemsFailed', 'Failed to delete some items') })

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
        showToast(toastRef, { severity: 'info', summary: t('toast.info'), detail: t('expenses.deletionCancelled', 'Deletion cancelled, items restored') })
    }

    // Render delete button for each row
    const renderDeleteButton = (rowData) => {
        const isCurrentlyEditing = currentlyEditingRowId === rowData.transactionId

        return (
            <button
                onClick={() => deleteExpenseItem(rowData.transactionId)}
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete this expense"
                disabled={isCurrentlyEditing}
            >
                <i className="pi pi-trash text-gray-600 hover:text-red-500 transition-colors"></i>
            </button>
        )
    }

    // Display template for currency amounts
    const renderCurrencyAmount = (rowData) => {
        const formatted = new Intl.NumberFormat(APP_SETTINGS.currency.locale, {
            style: 'currency',
            currency: APP_SETTINGS.currency.code,
        }).format(rowData.amount || 0)

        return (
            <div className="flex items-center gap-1">
                <span>{formatted}</span>
                {rowData.mileage?.transactions?.length > 0 && (
                    <i className="pi pi-car text-blue-500 text-xs" title={t('mileage.hasMileage', 'Includes mileage')} />
                )}
            </div>
        )
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

            showToast(toastRef, { severity: 'success', summary: t('common.success'), detail: t('claims.approvedSuccess') })

        }
        catch (error) {
            showToast(
                toastRef, { severity: 'error', summary: t('common.error'), detail: t('claims.approveRejectError') })
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

            showToast(toastRef, { severity: 'success', summary: t('common.success'), detail: t('claims.rejectedSuccess') })
        }
        catch (error) {
        }
    }

    const renderActionsButton = (rowData) => {
        const isProcessed = rowData.status === 2 || rowData.status === 3 // 2=Approved, 3=Rejected

        return (
            <div className="flex gap-2">
                <Button label={t('claims.approve')} outlined className={BUTTON_STYLE.success} icon="pi pi-check" iconPos="right"
                    onClick={() => approveExpense(rowData.transactionId)} disabled={isProcessed} />
                <Button label={t('claims.reject')} outlined className={BUTTON_STYLE.danger} icon="pi pi-times" iconPos="right"
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

    // Get selected expense detail for mobile full-screen view
    const selectedExpense = mobileExpandedId
        ? expenseItems.find(item => item.transactionId === mobileExpandedId)
        : null

    // Mobile expense card (summary only, tappable) — plain render function to avoid remount
    const renderMobileExpenseCard = (item) => {
        const isProcessed = item.status === 2 || item.status === 3
        return (
            <div
                className="admin-card cursor-pointer"
                onClick={() => setMobileExpandedId(item.transactionId)}
            >
                <div className="admin-card-header">
                    <div className="flex-1 min-w-0">
                        <div className="admin-card-title text-sm">
                            #{item.transactionId} — {formatCurrency(item.amount)}
                            {item.mileage?.transactions?.length > 0 && (
                                <i className="pi pi-car text-blue-500 text-xs ml-1" title={t('mileage.hasMileage', 'Includes mileage')} />
                            )}
                        </div>
                        <div className="admin-card-subtitle text-xs">
                            {item.transactionDate} · {item.vendor || '—'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {mode !== 'create' && <StatusTab status={item.status} />}
                        <i className="pi pi-chevron-right text-gray-400 text-xs" />
                    </div>
                </div>
            </div>
        )
    }

    // Mobile full-screen detail view — plain render function to avoid remount
    const renderMobileDetailView = (item) => {
        const isProcessed = item.status === 2 || item.status === 3
        return (
            <div className="mobile-expense-detail">
                {/* Header with back button */}
                <div className="mobile-expense-detail-header">
                    <Button
                        icon="pi pi-arrow-left"
                        text
                        rounded
                        severity="secondary"
                        onClick={() => setMobileExpandedId(null)}
                        className="!p-1"
                    />
                    <h4 className="text-base font-semibold flex-1">
                        {t('expenses.title')} #{item.transactionId}
                    </h4>
                    {mode !== 'create' && <StatusTab status={item.status} />}
                    {mode !== 'view' && (
                        <div className="flex items-center gap-1">
                            <Button
                                icon="pi pi-pencil"
                                text
                                rounded
                                severity="info"
                                onClick={() => startMobileEdit(item)}
                                className="!p-1"
                            />
                            <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                severity="danger"
                                onClick={() => {
                                    deleteExpenseItem(item.transactionId)
                                    setMobileExpandedId(null)
                                }}
                                className="!p-1"
                            />
                        </div>
                    )}
                </div>

                {/* Detail fields (read-only) */}
                <div className="mobile-expense-detail-body">
                    <div className="mobile-detail-row">
                        <span className="mobile-detail-label">{t('expenses.amount')}</span>
                        <span className="mobile-detail-value font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="mobile-detail-row">
                        <span className="mobile-detail-label">{t('expenses.transactionDate')}</span>
                        <span className="mobile-detail-value">{item.transactionDate || '—'}</span>
                    </div>
                    <div className="mobile-detail-row">
                        <span className="mobile-detail-label">{t('expenses.vendor')}</span>
                        <span className="mobile-detail-value">{item.vendor || '—'}</span>
                    </div>
                    <div className="mobile-detail-row">
                        <span className="mobile-detail-label">{t('expenses.buyer')}</span>
                        <span className="mobile-detail-value">{item.buyer || '—'}</span>
                    </div>
                    <div className="mobile-detail-row">
                        <span className="mobile-detail-label">{t('expenses.accountNumber')}</span>
                        <span className="mobile-detail-value text-sm">{accountNumMap[item.accountNum] || '—'}</span>
                    </div>
                    <div className="mobile-detail-row">
                        <span className="mobile-detail-label">{t('expenses.costCentre')}</span>
                        <span className="mobile-detail-value text-sm">{costCentreMap[item.costCentre] || '—'}</span>
                    </div>
                    {item.description && (
                        <div className="mobile-detail-row-stacked">
                            <span className="mobile-detail-label">{t('expenses.description')}</span>
                            <p className="mobile-detail-text">{item.description}</p>
                        </div>
                    )}
                </div>

                {/* Expansion content (program, tags, notes, attachments) */}
                <div className="mobile-expense-detail-expansion">
                    <ClaimRowExpansion
                        rowData={item}
                        editingRowId={currentlyEditingRowId}
                        claimItems={expenseItems}
                        expandedRowData={unsavedExpansionChanges}
                        handleInputChange={handleExpansionFieldChange}
                        mode={mode}
                    />
                </div>

                {/* Action buttons */}
                {mode === 'edit' && (
                    <div className="mobile-expense-detail-actions">
                        <Button
                            icon="pi pi-check"
                            size="small"
                            outlined
                            severity="success"
                            label={t('claims.approve', 'Approve')}
                            onClick={() => approveExpense(item.transactionId)}
                            disabled={isProcessed}
                        />
                        <Button
                            icon="pi pi-times"
                            size="small"
                            outlined
                            severity="danger"
                            label={t('claims.reject', 'Reject')}
                            onClick={() => rejectExpense(item.transactionId)}
                            disabled={isProcessed}
                        />
                    </div>
                )}
            </div>
        )
    }

    // Mobile view: show list or detail — plain render function to avoid remount
    const renderMobileView = () => {
        if (selectedExpense) {
            return renderMobileDetailView(selectedExpense)
        }
        return (
            <div className="admin-mobile-list">
                {expenseItems.map(item => (
                    <React.Fragment key={item.transactionId}>{renderMobileExpenseCard(item)}</React.Fragment>
                ))}
            </div>
        )
    }

    return (
        <div className="bg-white h-full p-3 md:p-6">

            {/* Expenses Header*/}
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                    <h3 className="text-lg md:text-[22px] font-semibold">{t('expenses.title')}</h3>

                    {/* deferred deletion control buttons */}
                    {pendingDeletions.length > 0 && (
                        <div className="flex items-center gap-2 animate-fadeIn">
                            <Button
                                icon="pi pi-check"
                                rounded
                                text
                                severity="success"
                                aria-label={t('common.confirmDelete')}
                                onClick={triggerConfirmDeletions}
                                tooltip={t('common.confirmDelete')}
                                type="button"
                            />
                            <Button
                                icon="pi pi-times"
                                rounded
                                text
                                severity="danger"
                                aria-label={t('common.cancelDelete')}
                                onClick={handleCancelDeletions}
                                tooltip={t('common.cancelDelete')}
                                type="button"
                            />
                            <span className="text-sm text-red-500 font-medium">
                                ({pendingDeletions.length} to delete)
                            </span>
                        </div>
                    )}
                </div>

                <div className="text-sm text-gray-600">
                    {expenseItems.length} {expenseItems.length === 1 ? t('expenses.item') : t('expenses.items')} •
                    {t('claims.total', 'Total')}: {formatCurrency(expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                </div>
            </div>

            {/*Expenses Table*/}
            {expenseItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">{t('expenses.noExpenses')}</p>
                    <p className="text-sm">
                        {mode === 'create'
                            ? t('expenses.addFirstExpense')
                            : t('expenses.noExpenseItems')
                        }
                    </p>
                </div>
            ) : isMobile ? (
                renderMobileView()
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
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"

                    //  Appearance & Behavior
                    tableStyle={{ minWidth: '50rem' }}
                    emptyMessage={t('expenses.noExpensesDisplay')}
                    size="small"
                    scrollable
                >
                    <Column expander />
                    <Column
                        field="transactionId"
                        header={t('common.id', 'ID')}
                    />
                    <Column
                        field="transactionDate"
                        header={t('expenses.transactionDate')}
                        editor={dateInputEditor}
                        style={{ minWidth: '150px' }}
                    />

                    <Column
                        field="vendor"
                        header={t('expenses.vendor')}
                        editor={expenseTextEditor}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="accountNum"
                        header={t('expenses.accountNumber')}
                        editor={accountNumEditor(accountNums)}
                        body={(rowData) => accountNumMap[rowData.accountNum] || ''}
                        style={{ minWidth: '200px' }}
                    />

                    <Column
                        field="costCentre"
                        header={t('expenses.costCentre')}
                        editor={costCentreEditor(costCentres)}
                        body={(rowData) => costCentreMap[rowData.costCentre] || ''}
                        style={{ minWidth: '200px' }}
                    />
                    <Column
                        field="amount"
                        header={t('expenses.amount')}
                        body={renderCurrencyAmount}
                        editor={currencyInputEditor}
                        style={{ minWidth: '120px' }}
                    />
                    <Column
                        field="buyer"
                        header={t('expenses.buyer')}
                        editor={expenseTextEditor}
                        style={{ minWidth: '120px' }}
                    />

                    {mode !== 'create' &&
                        <Column
                            field="status"
                            header={t('common.status')}
                            body={renderStatus}
                            style={{ minWidth: '120px' }}
                        />
                    }

                    {mode !== 'view' &&
                        <Column
                            rowEditor={true}
                            header={t('common.edit')}
                        />
                    }

                    {mode !== 'view' && <Column
                        body={renderDeleteButton}
                        header={t('common.delete')}
                    />
                    }

                    {mode === 'edit' && (
                        <Column
                            body={renderActionsButton}
                            header={t('common.action')}
                        />
                    )}
                </DataTable>
            )
            }

            {/* Mobile Edit Dialog */}
            <Dialog
                header={t('expenses.editExpense', 'Edit Expense')}
                visible={!!mobileEditData}
                style={{ width: '90vw', maxWidth: '450px' }}
                onHide={() => cancelMobileEdit()}
                className="mobile-edit-dialog"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={() => cancelMobileEdit()} />
                        <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={saveMobileEdit} />
                    </div>
                }
            >
                {mobileEditData && (
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <label className="block text-sm font-medium">{t('expenses.amount')}*</label>
                                {mobileEditErrors.amount && <span className="text-status-danger text-xs">({t(mobileEditErrors.amount)})</span>}
                            </div>
                            <InputNumber
                                value={mobileEditData.amount}
                                onValueChange={(e) => updateMobileField('amount', e.value)}
                                mode="currency"
                                currency={APP_SETTINGS.currency.code}
                                locale={APP_SETTINGS.currency.locale}
                                className="w-full"
                                inputClassName="text-right"
                            />
                        </div>
                        <Input
                            name="transactionDate"
                            label={t('expenses.transactionDate') + '*'}
                            type="date"
                            value={mobileEditData.transactionDate || ''}
                            onChange={(e) => updateMobileField('transactionDate', e.target.value)}
                            errors={mobileEditErrors}
                        />
                        <Input
                            name="vendor"
                            label={t('expenses.vendor') + '*'}
                            value={mobileEditData.vendor || ''}
                            onChange={(e) => updateMobileField('vendor', e.target.value)}
                            errors={mobileEditErrors}
                        />
                        <Input
                            name="buyer"
                            label={t('expenses.buyer') + '*'}
                            value={mobileEditData.buyer || ''}
                            onChange={(e) => updateMobileField('buyer', e.target.value)}
                            errors={mobileEditErrors}
                        />
                        <Select
                            name="accountNum"
                            label={t('expenses.accountNumber') + '*'}
                            value={mobileEditData.accountNum}
                            onChange={(e) => updateMobileField('accountNum', e.target.value)}
                            options={accountNums.map(opt => ({
                                label: `${opt.account_number} - ${opt.description}`,
                                value: opt.account_number_id,
                            }))}
                            placeholder={t('expenses.selectAccountNumber', 'Select account')}
                            errors={mobileEditErrors}
                        />
                        <Select
                            name="costCentre"
                            label={t('expenses.costCentre') + '*'}
                            value={mobileEditData.costCentre}
                            onChange={(e) => updateMobileField('costCentre', e.target.value)}
                            options={costCentres.map(opt => ({
                                label: `${opt.cost_centre_code} - ${opt.description}`,
                                value: opt.cost_centre_id,
                            }))}
                            placeholder={t('expenses.selectCostCentre', 'Select cost centre')}
                            errors={mobileEditErrors}
                        />

                        {/* Mileage Transactions */}
                        {mobileEditData.mileage?.transactions?.length > 0 && (
                            <div className="border-t pt-4 mt-2">
                                <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <i className="pi pi-car text-blue-500" />
                                    {t('mileage.title', 'Mileage')}
                                </h5>
                                {mobileEditData.mileage.transactions.map((tx, idx) => {
                                    const txErrs = mobileEditErrors.mileageTx?.[idx] || {}
                                    const mappedErrors = {}
                                    Object.entries(txErrs).forEach(([field, msgKey]) => {
                                        const nameMap = {
                                            transaction_date: `tx_date_${idx}`,
                                            travel_from: `tx_travel_from_${idx}`,
                                            travel_to: `tx_travel_to_${idx}`,
                                            distance_km: `tx_distance_${idx}`,
                                            meter_km: `tx_meter_${idx}`,
                                            parking_amount: `tx_parking_${idx}`,
                                            buyer: `tx_buyer_${idx}`,
                                        }
                                        mappedErrors[nameMap[field] || field] = msgKey
                                    })
                                    return (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-semibold text-gray-500 mb-2">
                                            {t('mileage.transaction', 'Transaction')} #{idx + 1}
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <Input
                                                name={`tx_date_${idx}`}
                                                label={t('mileage.transactionDate', 'Date') + '*'}
                                                type="date"
                                                value={tx.transaction_date?.substring(0, 10) || ''}
                                                onChange={(e) => updateMobileMileageTx(idx, 'transaction_date', e.target.value)}
                                                errors={mappedErrors}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    name={`tx_travel_from_${idx}`}
                                                    label={t('mileage.travelFrom', 'Travel From') + '*'}
                                                    value={tx.travel_from || ''}
                                                    onChange={(e) => updateMobileMileageTx(idx, 'travel_from', e.target.value)}
                                                    errors={mappedErrors}
                                                />
                                                <Input
                                                    name={`tx_travel_to_${idx}`}
                                                    label={t('mileage.travelTo', 'Travel To') + '*'}
                                                    value={tx.travel_to || ''}
                                                    onChange={(e) => updateMobileMileageTx(idx, 'travel_to', e.target.value)}
                                                    errors={mappedErrors}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    name={`tx_distance_${idx}`}
                                                    label={t('mileage.distance', 'Distance (km)')}
                                                    inputMode="decimal"
                                                    value={tx.distance_km ?? ''}
                                                    onChange={(e) => updateMobileMileageTx(idx, 'distance_km', e.target.value)}
                                                    errors={mappedErrors}
                                                />
                                                <Input
                                                    name={`tx_buyer_${idx}`}
                                                    label={t('mileage.buyer', 'Buyer') + '*'}
                                                    value={tx.buyer || ''}
                                                    onChange={(e) => updateMobileMileageTx(idx, 'buyer', e.target.value)}
                                                    errors={mappedErrors}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    name={`tx_meter_${idx}`}
                                                    label={t('mileage.meter', 'Meter (Max. $5)')}
                                                    inputMode="decimal"
                                                    value={tx.meter_km ?? ''}
                                                    onChange={(e) => updateMobileMileageTx(idx, 'meter_km', e.target.value)}
                                                    errors={mappedErrors}
                                                />
                                                <Input
                                                    name={`tx_parking_${idx}`}
                                                    label={t('mileage.parking', 'Parking ($)')}
                                                    inputMode="decimal"
                                                    value={tx.parking_amount ?? ''}
                                                    onChange={(e) => updateMobileMileageTx(idx, 'parking_amount', e.target.value)}
                                                    errors={mappedErrors}
                                                />
                                            </div>
                                            <div className="text-right text-sm font-semibold text-blue-700">
                                                {t('common.total', 'Total')}: {formatCurrency(tx.total_amount)}
                                            </div>
                                        </div>
                                    </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </Dialog>
        </div>
    )

}

export default EditableExpansionTable