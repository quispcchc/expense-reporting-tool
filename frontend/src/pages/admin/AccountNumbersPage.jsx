import React, { useEffect, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewAccountNumber from '../../components/feature/accountNumber/AddNewAccountNumber.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useAccountNumber } from '../../contexts/AccountNumberContext.jsx'
import { Button } from 'primereact/button'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { useDataTableFilter } from '../../hooks/useDataTableFilter.js'
import { useMobileEditDialog } from '../../hooks/useMobileEditDialog.js'
import { textInputEditor } from '../../utils/dataTableEditors.jsx'
import DataTableSearchHeader from '../../components/common/ui/DataTableSearchHeader.jsx'
import MobileEditDialog from '../../components/common/ui/MobileEditDialog.jsx'
import { showToast, TOAST_LIFE } from '../../utils/helpers.js'
import { validateForm } from '../../utils/validation/validator.js'
import { validationSchemas } from '../../utils/validation/schemas.js'
import Input from '../../components/common/ui/Input.jsx'

function AccountNumbersPage() {
    const { t } = useTranslation()
    const { refreshLookups } = useLookups()
    const isMobile = useIsMobile()

    const {
        state: { accountNumbers, loading, error },
        actions: { updateAccountNumber, deleteAccountNumber },
    } = useAccountNumber()

    const { globalFilterValue, filters, onGlobalFilterChange } = useDataTableFilter()
    const { editDialog, editData, editErrors, openDialog, closeDialog, updateField, validate } = useMobileEditDialog({ validationSchema: validationSchemas.editAccountNumber })


    const toast = useRef(null)
    const toasts = {
        created: () => {
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('accountNumbers.createSuccess', 'Account Number created successfully!'), life: TOAST_LIFE.SUCCESS })
            refreshLookups()
        },
        updated: () => {
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('accountNumbers.updateSuccess', 'Account Number updated successfully!'), life: TOAST_LIFE.SUCCESS })
            refreshLookups()
        },
        error: () => {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: error || 'Something went wrong.', life: TOAST_LIFE.ERROR })
        },
        accept: async (accountNumberId) => {
            const result = await deleteAccountNumber(accountNumberId)
            if (result?.success) {
                showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('accountNumbers.deleteSuccess', 'Account Number deleted successfully!'), life: TOAST_LIFE.SUCCESS })
                refreshLookups()
            } else {
                showToast(toast, { severity: 'error', summary: t('common.error'), detail: result?.error || 'Delete failed', life: TOAST_LIFE.ERROR })
            }
        },
        reject: () => {
            showToast(toast, { severity: 'info', summary: t('common.cancelled', 'Cancelled'), detail: t('common.operationCancelled', 'Operation cancelled'), life: TOAST_LIFE.INFO })
        },
    }

    useEffect(() => {
        if (error) {
            toasts.error()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

    const onRowEditComplete = async (e) => {
        const { isValid, errors: validationErrors } = validateForm(e.newData, validationSchemas.editAccountNumber)
        if (!isValid) {
            const messages = Object.values(validationErrors).map(key => t(key)).join(', ')
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: messages, life: TOAST_LIFE.ERROR })
            return
        }
        const result = await updateAccountNumber(e.newData)
        if (result?.success) {
            toasts.updated()
        }
    }

    const onDelete = (accountNumberId) => {
        confirmDialog({
            message: t('accountNumbers.deleteConfirmMessage', 'Are you sure you want to delete this account number? This action cannot be undone.'),
            header: t('accountNumbers.deleteItem', 'Delete Account Number'),
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: () => toasts.accept(accountNumberId),
            reject: toasts.reject,
        })
    }

    const renderDeleteButton = (rowData) => {
        return (
            <button
                onClick={() => onDelete(rowData.account_number_id)}
                type="button"
                className="p-2 disabled:opacity-50"
                title="Delete this account number"
            >
                <i className="pi pi-trash"></i>
            </button>
        )
    }

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        const { isValid } = validate()
        if (!isValid) return
        const result = await updateAccountNumber(editData)
        if (result?.success) {
            toasts.updated()
        }
        closeDialog()
    }

    // Filter account numbers for mobile search
    const filteredAccountNumbers = accountNumbers?.filter(an => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            an.account_number?.toString().toLowerCase().includes(q) ||
            an.description?.toLowerCase().includes(q)
        )
    }) || []

    // Mobile card view
    const mobileCardView = (
        <div className="admin-mobile-container">
            <div className="admin-mobile-search">
                <DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />
            </div>

            <div className="admin-mobile-list">
                {filteredAccountNumbers.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredAccountNumbers.map(an => (
                        <div key={an.account_number_id} className="admin-card">
                            <div className="admin-card-header">
                                <div>
                                    <div className="admin-card-title">{an.account_number}</div>
                                </div>
                            </div>
                            <div className="admin-card-body">
                                <div className="admin-card-row">
                                    <span className="admin-card-label">{t('accountNumbers.description', 'Description')}</span>
                                    <span className="admin-card-value">{an.description || '—'}</span>
                                </div>
                            </div>
                            <div className="admin-card-actions">
                                <Button
                                    icon="pi pi-pencil"
                                    size="small"
                                    text
                                    onClick={() => openDialog(an)}
                                />
                                <Button
                                    icon="pi pi-trash"
                                    size="small"
                                    text
                                    severity="danger"
                                    onClick={() => onDelete(an.account_number_id)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )

    // Desktop table view
    const desktopTableView = (
        <div className="bg-white rounded-xl p-6 mt-5">
            <DataTable value={accountNumbers} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]}
                paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate="{first} to {last} of {totalRecords}"
                filters={filters} globalFilterFields={[
                    'account_number',
                    'description',
                ]}
                header={<DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />} emptyMessage={t('common.noResults')}
                editMode="row" onRowEditComplete={onRowEditComplete}
                sortMode="multiple" removableSort
                loading={loading}
                scrollable
                tableStyle={{ minWidth: '50rem' }}>
                <Column field="account_number" header={t('accountNumbers.accountNumber', 'Account Number')} sortable editor={textInputEditor}></Column>
                <Column field="description" header={t('accountNumbers.description', 'Description')} sortable editor={textInputEditor}></Column>
                <Column
                    rowEditor={true}
                    header={t('common.edit')}
                />
                <Column
                    header={t('common.delete')}
                    body={renderDeleteButton}
                />
            </DataTable>
        </div>
    )

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <ContentHeader title={t('accountNumbers.title', 'Account Numbers')} homePath="/admin" iconKey="sidebar.accountNumbers" />
            <AddNewAccountNumber createdToast={toasts.created} />

            {isMobile ? mobileCardView : desktopTableView}

            {/* Mobile Edit Dialog */}
            <MobileEditDialog visible={editDialog} header={t('accountNumbers.editAccountNumber', 'Edit Account Number')} onHide={closeDialog} onSave={handleMobileEditSave}>
                {editData && (
                    <div className="flex flex-col gap-4">
                        <Input name="account_number" label={t('accountNumbers.accountNumber', 'Account Number')} type="number" value={editData.account_number || ''} errors={editErrors}
                            onChange={(e) => updateField('account_number', e.target.value)} />
                        <Input name="description" label={t('accountNumbers.description', 'Description')} value={editData.description || ''} errors={editErrors}
                            onChange={(e) => updateField('description', e.target.value)} />
                    </div>
                )}
            </MobileEditDialog>
        </>
    )
}

export default AccountNumbersPage
