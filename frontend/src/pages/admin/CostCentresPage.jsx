import React, { useEffect, useRef, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewCostCentre from '../../components/feature/costCentre/AddNewCostCentre.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useCostCentre } from '../../contexts/CostCentreContext.jsx'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { FilterMatchMode } from 'primereact/api'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../hooks/useIsMobile.js'

function CostCentresPage() {
    const { t } = useTranslation()
    const { lookups } = useLookups()
    const isMobile = useIsMobile()

    const {
        state: { costCentres, loading, error },
        actions: { updateCostCentre, deleteCostCentre },
    } = useCostCentre()

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

    const renderStatus = (rowData) => (
        <ActiveStatusTab status={rowData.active_status_id} />
    )

    const departmentOptions = lookups.departments.map(d => ({
        label: d.department_name,
        value: d.department_id,
    }))

    const statusOptions = lookups.activeStatuses.map(s => ({
        label: s.active_status_name,
        value: s.active_status_id,
    }))

    const departmentEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.value)}
            options={departmentOptions}
        />
    )

    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

    const statusEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => { editorOptions.editorCallback(e.value) }}
            options={statusOptions}
        />
    )

    const toast = useRef(null)
    const toasts = {
        created: () => {
            toast.current.show(
                { severity: 'success', summary: 'Created', detail: 'Created successfully!', life: 3000 })
        },
        updated: () => {
            toast.current.show(
                { severity: 'success', summary: 'Updated', detail: 'Updated successfully!', life: 3000 })
        },
        error: () => {
            toast.current.show(
                { severity: 'error', summary: 'Error', detail: error || 'Something went wrong.', life: 3000 })
        },
        accept: async (costCentreId) => {
            const response = await deleteCostCentre(costCentreId)
            if (response) {
                toast.current.show(
                    { severity: 'success', summary: 'Deleted', detail: 'Deleted successfully!', life: 3000 })
            }
        },
        reject: () => {
            toast.current.show({ severity: 'info', summary: 'Cancelled', detail: 'Cancelled', life: 3000 })
        },
    }

    useEffect(() => {
        if (error) {
            toasts.error()
        }
    }, [error])

    const onRowEditComplete = async (e) => {
        const response = await updateCostCentre(e.newData)
        if (response?.status === 200) {
            toasts.updated()
        }
    }

    const onDelete = (costCentreId) => {
        confirmDialog({
            message: t('costCentre.deleteConfirmMessage', 'Are you sure you want to delete this item? This action cannot be undone.'),
            header: t('costCentre.deleteItem', 'Delete Item'),
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-danger',
            accept: () => toasts.accept(costCentreId),
            reject: toasts.reject,
        })
    }

    const renderDeleteButton = (rowData) => {
        return (
            <button
                onClick={() => onDelete(rowData.cost_centre_id)}
                type="button"
                className="p-2 disabled:opacity-50"
                title="Delete this expense"
            >
                <i className="pi pi-trash"></i>
            </button>
        )
    }

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        const response = await updateCostCentre(editData)
        if (response?.status === 200) {
            toasts.updated()
        }
        setEditDialog(false)
        setEditData(null)
    }

    // Filter cost centres for mobile search
    const filteredCostCentres = costCentres?.filter(cc => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            cc.cost_centre_code?.toLowerCase().includes(q) ||
            cc.description?.toLowerCase().includes(q) ||
            cc.department?.department_name?.toLowerCase().includes(q)
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
                {filteredCostCentres.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredCostCentres.map(cc => (
                        <div key={cc.cost_centre_id} className="admin-card">
                            <div className="admin-card-header">
                                <div>
                                    <div className="admin-card-title">{cc.cost_centre_code}</div>
                                    <div className="admin-card-subtitle">{cc.department?.department_name}</div>
                                </div>
                                <ActiveStatusTab status={cc.active_status_id} />
                            </div>
                            <div className="admin-card-body">
                                <div className="admin-card-row">
                                    <span className="admin-card-label">{t('costCentre.description', 'Description')}</span>
                                    <span className="admin-card-value">{cc.description || '—'}</span>
                                </div>
                            </div>
                            <div className="admin-card-actions">
                                <Button
                                    icon="pi pi-pencil"
                                    size="small"
                                    text
                                    onClick={() => {
                                        setEditData({ ...cc })
                                        setEditDialog(true)
                                    }}
                                />
                                <Button
                                    icon="pi pi-trash"
                                    size="small"
                                    text
                                    severity="danger"
                                    onClick={() => onDelete(cc.cost_centre_id)}
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
            <DataTable value={costCentres} paginator rows={5} rowsPerPageOptions={[5, 10, 25, 50]}
                paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate="{first} to {last} of {totalRecords}"
                filters={filters} globalFilterFields={[
                    'department.department_name',
                    'cost_centre_code',
                    'active_status.active_status_name',
                    'description',
                ]}
                header={renderHeader} emptyMessage={t('common.noResults')}
                editMode="row" onRowEditComplete={onRowEditComplete}
                sortMode="multiple" removableSort
                loading={loading}
                scrollable
                tableStyle={{ minWidth: '50rem' }}>
                <Column field="department_id" header={t('users.department')} sortable editor={departmentEditor}
                    body={(rowData) => rowData.department?.department_name}></Column>
                <Column field="cost_centre_code" header={t('teams.code')} sortable editor={textInputEditor}></Column>
                <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable
                    editor={statusEditor}></Column>
                <Column field="description" header={t('costCentre.description', 'Description')} sortable editor={textInputEditor}></Column>
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
            <ContentHeader title={t('sidebar.costCentre')} homePath="/admin" iconKey="sidebar.costCentre" />
            <AddNewCostCentre createdToast={toasts.created} />

            {isMobile ? mobileCardView : desktopTableView}

            {/* Mobile Edit Dialog */}
            <Dialog
                header={t('costCentre.editCostCentre', 'Edit Cost Centre')}
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
                            <label>{t('users.department')}</label>
                            <Dropdown
                                value={editData.department_id}
                                onChange={(e) => setEditData({ ...editData, department_id: e.value })}
                                options={departmentOptions}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('teams.code')}</label>
                            <InputText
                                value={editData.cost_centre_code || ''}
                                onChange={(e) => setEditData({ ...editData, cost_centre_code: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('common.status')}</label>
                            <Dropdown
                                value={editData.active_status_id}
                                onChange={(e) => setEditData({ ...editData, active_status_id: e.value })}
                                options={statusOptions}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('costCentre.description', 'Description')}</label>
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

export default CostCentresPage