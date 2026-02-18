import React, { useEffect, useRef, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewAccountNumber from '../../components/feature/accountNumber/AddNewAccountNumber.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useAccountNumber } from '../../contexts/AccountNumberContext.jsx'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { FilterMatchMode } from 'primereact/api'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../hooks/useIsMobile.js'

function AccountNumbersPage() {
    const { t } = useTranslation()
    const { refreshLookups } = useLookups()
    const isMobile = useIsMobile()

    const {
        state: { accountNumbers, loading, error },
        actions: { updateAccountNumber, deleteAccountNumber },
    } = useAccountNumber()

    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Mobile edit dialog state
    const [editDialog, setEditDialog] = useState(false)
    const [editData, setEditData] = useState(null)

    const onGlobalFilterChange = (e) => {
        const value = e.target.value
        let _filters = { ...filters }
        _filters['global'].value = value
        setFilters(_filters)
        setGlobalFilterValue(value)
    }

    const renderHeader = () => {
        return (
            <div className="flex justify-end">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange}
                        placeholder={t('common.keywordSearch')} />
                </IconField>
            </div>
        )
    }

    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

    const toast = useRef(null)
    const toasts = {
        created: () => {
            toast.current.show(
                { severity: 'success', summary: t('common.success', 'Success'), detail: t('accountNumbers.createSuccess', 'Account Number created successfully!'), life: 3000 })
            refreshLookups()
        },
        updated: () => {
            toast.current.show(
                { severity: 'success', summary: t('common.success', 'Success'), detail: t('accountNumbers.updateSuccess', 'Account Number updated successfully!'), life: 3000 })
            refreshLookups()
        },
        error: () => {
            toast.current.show(
                { severity: 'error', summary: t('common.error', 'Error'), detail: error || 'Something went wrong.', life: 3000 })
        },
        accept: async (accountNumberId) => {
            const response = await deleteAccountNumber(accountNumberId)
            if (response && !response.error) {
                toast.current.show(
                    { severity: 'success', summary: t('common.success', 'Success'), detail: t('accountNumbers.deleteSuccess', 'Account Number deleted successfully!'), life: 3000 })
                refreshLookups()
            } else {
                toast.current.show(
                    { severity: 'error', summary: t('common.error', 'Error'), detail: response?.error || 'Delete failed', life: 3000 })
            }
        },
        reject: () => {
            toast.current.show({ severity: 'info', summary: t('common.cancelled', 'Cancelled'), detail: t('common.operationCancelled', 'Operation cancelled'), life: 3000 })
        },
    }

    useEffect(() => {
        if (error) {
            toasts.error()
        }
    }, [error])

    const onRowEditComplete = async (e) => {
        const response = await updateAccountNumber(e.newData)
        if (response?.status === 200) {
            toasts.updated()
        } else if (response?.error) {
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: response.error,
                life: 5000
            })
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
        const response = await updateAccountNumber(editData)
        if (response?.status === 200) {
            toasts.updated()
        } else if (response?.error) {
            toast.current.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: response.error,
                life: 5000
            })
        }
        setEditDialog(false)
        setEditData(null)
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
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder={t('common.keywordSearch')}
                    />
                </IconField>
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
                                    onClick={() => {
                                        setEditData({ ...an })
                                        setEditDialog(true)
                                    }}
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
                header={renderHeader} emptyMessage={t('common.noResults')}
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
            <Dialog
                header={t('accountNumbers.editAccountNumber', 'Edit Account Number')}
                visible={editDialog}
                style={{ width: '90vw', maxWidth: '450px' }}
                onHide={() => { setEditDialog(false); setEditData(null) }}
                className="mobile-edit-dialog"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={() => { setEditDialog(false); setEditData(null) }} />
                        <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={handleMobileEditSave} />
                    </div>
                }
            >
                {editData && (
                    <>
                        <div className="edit-field">
                            <label>{t('accountNumbers.accountNumber', 'Account Number')}</label>
                            <InputText
                                type="number"
                                value={editData.account_number || ''}
                                onChange={(e) => setEditData({ ...editData, account_number: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('accountNumbers.description', 'Description')}</label>
                            <InputText
                                value={editData.description || ''}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            />
                        </div>
                    </>
                )}
            </Dialog>
        </>
    )
}

export default AccountNumbersPage
