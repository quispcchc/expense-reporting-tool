import React, { useEffect, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputNumber } from 'primereact/inputnumber'
import { Button } from 'primereact/button'
import StatusTab from '../../../common/ui/StatusTab.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'
import { APP_SETTINGS } from '../../../../config/settings.js'
import { APPROVAL_STATUS } from '../../../../config/constants.js'
import { showToast } from '../../../../utils/helpers.js'
import api, { API_BASE_URL } from '../../../../api/api.js'
import { BUTTON_STYLE } from '../../../../utils/customizeStyle.js'
import { confirmDialog } from 'primereact/confirmdialog'
import { Dialog } from 'primereact/dialog'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../../../hooks/useIsMobile.js'
import { validateForm } from '../../../../utils/validation/validator.js'
import { validationSchemas } from '../../../../utils/validation/schemas.js'
import { formatCurrency } from '../../../../utils/formatters.js'
import mapExpenseData from '../../../../utils/mapExpenseData.js'
import { expenseTextEditor, accountNumEditor, costCentreEditor, currencyInputEditor, dateInputEditor } from '../../../../utils/expenseEditors.jsx'
import { useAuth } from '../../../../contexts/AuthContext.jsx'
import { ROLE_NAME, VIEW_MODE } from '../../../../config/constants.js'
import TransactionEditDialog from './TransactionEditDialog.jsx'

function EditableExpansionTable({ data, curClaim, mode, onClaimItemsUpdate, toastRef, onClaimUpdated }) {
    const { t } = useTranslation()
    const isMobile = useIsMobile()
    const { authUser } = useAuth()
    const [expenseItems, setExpenseItems] = useState(() => mapExpenseData(data, mode))

    const [currentlyEditingRowId, setCurrentlyEditingRowId] = useState(null)
    const [originalExpenseData] = useState({})

    const [pendingDeletions, setPendingDeletions] = useState([]) // Store items waiting to be permanently deleted

    const { lookups, lookups: { accountNums, costCentres } } = useLookups()

    const [processingExpenses, setProcessingExpenses] = useState(new Set())
    const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
    const [currentTransactionIndex, setCurrentTransactionIndex] = useState(-1)

    const openTransactionDialog = (index) => {
        setCurrentTransactionIndex(index)
        setIsTransactionDialogOpen(true)
    }

    useEffect(() => {
        if (!data) return
        setExpenseItems(mapExpenseData(data, mode))
    }, [data, mode])

    const saveExpenseItemsToParent = (updatedExpenseItems) => {
        // Update local state first
        setExpenseItems(updatedExpenseItems)

        if (mode === VIEW_MODE.CREATE && onClaimItemsUpdate) {
            // In create mode: notify parent component of changes
            onClaimItemsUpdate(updatedExpenseItems)

        }
    }

    // Handle saving row edit
    const handleRowSaveComplete = async (editEvent) => {
        const updatedExpenseItems = [...expenseItems]
        const expenseId = editEvent.newData.transactionId

        // Merge the row edits
        const updated = updatedExpenseItems[editEvent.index] = {
            ...expenseItems[editEvent.index],
            ...editEvent.newData,
        }

        setCurrentlyEditingRowId(null)

        // Restore original row data on validation failure
        const restoreOriginalRow = () => {
            const original = originalExpenseData[expenseId]
            if (original) {
                setExpenseItems(prev => prev.map(e => e.transactionId === expenseId ? { ...original } : e))
            }
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
        if (mode === VIEW_MODE.CREATE) {
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
            deletedReceiptIds.forEach(id => formData.append('deleteReceiptIds[]', String(id)))
            const receiptIdsStr = deletedReceiptIds.join(',')
            formData.append('deleteReceiptIds', receiptIdsStr)
        } else {
            const receiptIdsStr = (deletedReceiptIds ?? '').toString()
            if (receiptIdsStr.length > 0) {
                formData.append('deleteReceiptIds', receiptIdsStr)
            }
        }

        // Laravel PUT workaround: add _method field to make POST work as PUT
        formData.append('_method', 'PUT')

        const response = await api.post(`expenses/${expenseId}`, formData)

        // Sync attachments and tags from backend response
        const serverExpense = response?.data
        if (serverExpense) {
            const mappedReceipts = Array.isArray(serverExpense.receipts)
                ? serverExpense.receipts.map(r => ({
                    url: `${API_BASE_URL}/api/storage/${r.receipt_path}`,
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

        // Save mileage header + transactions if mileage was edited
        if (editEvent.newData?.mileage) {
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
            message: mode === VIEW_MODE.CREATE
                ? t('expenses.removeItemsMessage', { count: pendingDeletions.length }, `Are you sure you want to remove these ${pendingDeletions.length} items from the list?`)
                : t('expenses.deleteItemsMessage', { count: pendingDeletions.length }, `Are you sure you want to delete these ${pendingDeletions.length} items permanently? This action cannot be undone.`),
            header: mode === VIEW_MODE.CREATE ? t('expenses.removeItems', 'Remove Items') : t('expenses.deleteItems', 'Delete Items'),
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: mode === VIEW_MODE.CREATE ? t('expenses.yesRemove', 'Yes, Remove') : t('expenses.yesDelete', 'Yes, Delete'),
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
                if (mode === VIEW_MODE.EDIT && item.transactionId) {
                    await api.delete(`expenses/${item.transactionId}`)
                }
            })

            await Promise.all(deletePromises)

            // Success - Clear pending list
            setPendingDeletions([])

            // Notify parent to refresh data if needed
            if (onClaimUpdated && mode === VIEW_MODE.EDIT) onClaimUpdated()

            showToast(toastRef, { severity: 'success', summary: t('toast.success'), detail: t('expenses.itemsDeletedPermanently', 'Items deleted permanently') })

        } catch {
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

    // Track which expenses are currently being processed (approve/reject in flight)
    // (processingExpenses state moved to top)

    const handleDialogSave = async (updatedTransaction) => {
        // Find index of transaction in expenseItems
        const index = expenseItems.findIndex(item => item.transactionId === updatedTransaction.transactionId)
        if (index === -1) return

        // We can simulate an editEvent to reuse handleRowSaveComplete
        const editEvent = {
            index,
            newData: updatedTransaction
        }

        await handleRowSaveComplete(editEvent)
    }

    const handleDialogNext = () => {
        if (currentTransactionIndex < expenseItems.length - 1) {
            setCurrentTransactionIndex(prev => prev + 1)
        }
    }

    const handleDialogPrev = () => {
        if (currentTransactionIndex > 0) {
            setCurrentTransactionIndex(prev => prev - 1)
        }
    }

    const handleDialogApprove = async (expenseId) => {
        await approveExpense(expenseId)
        if (currentTransactionIndex < expenseItems.length - 1) {
            handleDialogNext()
        }
    }

    const handleDialogReject = async (expenseId) => {
        await rejectExpense(expenseId)
        if (currentTransactionIndex < expenseItems.length - 1) {
            handleDialogNext()
        }
    }

    // Approve and Reject a single expense item
    async function approveExpense(expenseId) {
        setProcessingExpenses(prev => new Set(prev).add(expenseId))
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
        catch {
            showToast(
                toastRef, { severity: 'error', summary: t('common.error'), detail: t('claims.approveRejectError') })
        } finally {
            setProcessingExpenses(prev => {
                const next = new Set(prev)
                next.delete(expenseId)
                return next
            })
        }
    }

    async function rejectExpense(expenseId) {
        setProcessingExpenses(prev => new Set(prev).add(expenseId))
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
        catch {
            // Error handling deferred to finally block
        } finally {
            setProcessingExpenses(prev => {
                const next = new Set(prev)
                next.delete(expenseId)
                return next
            })
        }
    }

    // Claim-level approve/reject (all expenses)
    const [isClaimApproving, setIsClaimApproving] = useState(false)

    const isPending = curClaim?.claim_status_id === APPROVAL_STATUS.PENDING
    const isAdminOrApprover = authUser?.role_name === ROLE_NAME.SUPER_ADMIN || authUser?.role_name === ROLE_NAME.ADMIN || authUser?.role_name === ROLE_NAME.APPROVER
    const showClaimApprovalButtons = (mode === VIEW_MODE.EDIT || mode === VIEW_MODE.VIEW) && isPending && isAdminOrApprover

    const handleApproveClaim = () => {
        confirmDialog({
            message: t('claims.approveClaimMessage', 'Are you sure you want to approve this claim?'),
            header: t('claims.approveClaimHeader', 'Approve Claim'),
            icon: 'pi pi-check-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-success',
            accept: async () => {
                setIsClaimApproving(true)
                try {
                    await api.post('claims/bulk-approve', { claimIds: [curClaim.claim_id] })
                    setExpenseItems(prev => prev.map(item => ({ ...item, status: APPROVAL_STATUS.APPROVED })))
                    if (onClaimUpdated) onClaimUpdated()
                    showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t('claims.claimApproved', 'Claim approved successfully') })
                } catch (error) {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error', 'Error'), detail: error.message })
                } finally {
                    setIsClaimApproving(false)
                }
            },
        })
    }

    const handleRejectClaim = () => {
        confirmDialog({
            message: t('claims.rejectClaimMessage', 'Are you sure you want to reject this claim?'),
            header: t('claims.rejectClaimHeader', 'Reject Claim'),
            icon: 'pi pi-times-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setIsClaimApproving(true)
                try {
                    await api.post('claims/bulk-reject', { claimIds: [curClaim.claim_id] })
                    setExpenseItems(prev => prev.map(item => ({ ...item, status: APPROVAL_STATUS.REJECTED })))
                    if (onClaimUpdated) onClaimUpdated()
                    showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t('claims.claimRejected', 'Claim rejected successfully') })
                } catch (error) {
                    showToast(toastRef, { severity: 'error', summary: t('toast.error', 'Error'), detail: error.message })
                } finally {
                    setIsClaimApproving(false)
                }
            },
        })
    }

    const renderActionsButton = (rowData) => {
        const rowStatus = Number(rowData.status)
        const isProcessed = rowStatus === APPROVAL_STATUS.APPROVED || rowStatus === APPROVAL_STATUS.REJECTED
        const isProcessing = processingExpenses.has(rowData.transactionId)

        return (
            <div className="flex gap-2">
                {isAdminOrApprover && mode === VIEW_MODE.EDIT && (
                    <>
                        <Button label={t('claims.approve')} outlined className={BUTTON_STYLE.success} icon="pi pi-check" iconPos="right"
                            onClick={() => approveExpense(rowData.transactionId)} disabled={isProcessed || isProcessing}
                            loading={isProcessing} type="button" />
                        <Button label={t('claims.reject')} outlined className={BUTTON_STYLE.danger} icon="pi pi-times" iconPos="right"
                            onClick={() => rejectExpense(rowData.transactionId)} disabled={isProcessed || isProcessing} type="button" />
                    </>
                )}
            </div>
        )
    }

    const renderEditButton = (rowData) => {
        return (
            <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                onClick={() => {
                    const idx = expenseItems.findIndex(item => item.transactionId === rowData.transactionId)
                    openTransactionDialog(idx)
                }}
                type="button"
            />
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

    // Mobile expense card (summary only, tappable) — plain render function to avoid remount
    const renderMobileExpenseCard = (item) => {
        const _isProcessed = item.status === APPROVAL_STATUS.APPROVED || item.status === APPROVAL_STATUS.REJECTED
        return (
            <div
                className="admin-card cursor-pointer"
                onClick={() => openTransactionDialog(expenseItems.indexOf(item))}
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
                        {mode !== VIEW_MODE.CREATE && <StatusTab status={item.status} />}
                        <i className="pi pi-pencil text-gray-400 text-xs" />
                    </div>
                </div>
            </div>
        )
    }

    // Mobile view: show list — plain render function to avoid remount
    const renderMobileView = () => {
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

                <div className="flex items-center gap-3 flex-wrap">
                    {showClaimApprovalButtons && (
                        <>
                            <Button
                                label={t('claims.approveAll', 'Approve All')}
                                icon="pi pi-check"
                                iconPos="right"
                                outlined
                                className={BUTTON_STYLE.success}
                                onClick={handleApproveClaim}
                                loading={isClaimApproving}
                                disabled={isClaimApproving}
                                type="button"
                            />
                            <Button
                                label={t('claims.rejectAll', 'Reject All')}
                                icon="pi pi-times"
                                iconPos="right"
                                outlined
                                className={BUTTON_STYLE.danger}
                                onClick={handleRejectClaim}
                                loading={isClaimApproving}
                                disabled={isClaimApproving}
                                type="button"
                            />
                        </>
                    )}
                    <div className="text-sm text-gray-600">
                        {expenseItems.length} {expenseItems.length === 1 ? t('expenses.item') : t('expenses.items')} •
                        {t('claims.total', 'Total')}: {formatCurrency(expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0))}
                    </div>
                </div>
            </div>

            {/*Expenses Table*/}
            {expenseItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">{t('expenses.noExpenses')}</p>
                    <p className="text-sm">
                        {mode === VIEW_MODE.CREATE
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

                    {mode !== VIEW_MODE.CREATE &&
                        <Column
                            field="status"
                            header={t('common.status')}
                            body={renderStatus}
                            style={{ minWidth: '120px' }}
                        />
                    }

                    {mode !== VIEW_MODE.VIEW &&
                        <Column
                            body={renderEditButton}
                            header={t('common.edit')}
                        />
                    }

                    {mode !== VIEW_MODE.VIEW && <Column
                        body={renderDeleteButton}
                        header={t('common.delete')}
                    />
                    }

                    {(mode === VIEW_MODE.EDIT || mode === VIEW_MODE.VIEW) && (
                        <Column
                            body={renderActionsButton}
                            header={t('common.actions')}
                        />
                    )}
                </DataTable>
            )}

            <TransactionEditDialog
                visible={isTransactionDialogOpen}
                onHide={() => setIsTransactionDialogOpen(false)}
                transaction={expenseItems[currentTransactionIndex]}
                onSave={handleDialogSave}
                onApprove={handleDialogApprove}
                onReject={handleDialogReject}
                onNext={handleDialogNext}
                onPrev={handleDialogPrev}
                hasNext={currentTransactionIndex < expenseItems.length - 1}
                hasPrev={currentTransactionIndex > 0}
                lookups={lookups}
                processing={expenseItems[currentTransactionIndex] && processingExpenses.has(expenseItems[currentTransactionIndex].transactionId)}
                currentIndex={currentTransactionIndex}
                totalCount={expenseItems.length}
                isAdminOrApprover={isAdminOrApprover}
                mode={mode}
            />
        </div>
    )

}

export default EditableExpansionTable