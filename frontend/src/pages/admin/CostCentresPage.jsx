import React, { useEffect, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewCostCentre from '../../components/feature/costCentre/AddNewCostCentre.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useCostCentre } from '../../contexts/CostCentreContext.jsx'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'
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
import Select from '../../components/common/ui/Select.jsx'

function CostCentresPage() {
    const { t } = useTranslation()
    const { lookups } = useLookups()
    const isMobile = useIsMobile()

    const {
        state: { costCentres, loading, error },
        actions: { updateCostCentre, deleteCostCentre },
    } = useCostCentre()

    const { globalFilterValue, filters, onGlobalFilterChange } = useDataTableFilter()
    const { editDialog, editData, editErrors, openDialog, closeDialog, updateField, validate } = useMobileEditDialog({ validationSchema: validationSchemas.editCostCentre })


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
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('costCentre.createSuccess'), life: TOAST_LIFE.SUCCESS })
        },
        updated: () => {
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('costCentre.updateSuccess'), life: TOAST_LIFE.SUCCESS })
        },
        error: () => {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: error || t('common.unknownError'), life: TOAST_LIFE.ERROR })
        },
        accept: async (costCentreId) => {
            const result = await deleteCostCentre(costCentreId)
            if (result?.success) {
                showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('costCentre.deleteSuccess'), life: TOAST_LIFE.SUCCESS })
            } else {
                showToast(toast, { severity: 'error', summary: t('common.error'), detail: result?.error || t('common.unknownError'), life: TOAST_LIFE.ERROR })
            }
        },
        reject: () => {
            showToast(toast, { severity: 'info', summary: t('toast.info', 'Info'), detail: t('costCentre.cancelled'), life: TOAST_LIFE.INFO })
        },
    }

    useEffect(() => {
        if (error) {
            toasts.error()
        }
    }, [error])

    const onRowEditComplete = async (e) => {
        const { isValid, errors: validationErrors } = validateForm(e.newData, validationSchemas.editCostCentre)
        if (!isValid) {
            const messages = Object.values(validationErrors).map(key => t(key)).join(', ')
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: messages, life: TOAST_LIFE.ERROR })
            return
        }
        const result = await updateCostCentre(e.newData)
        if (result?.success) {
            toasts.updated()
        } else {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: result?.error || t('common.unknownError'), life: TOAST_LIFE.ERROR })
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
        const { isValid } = validate()
        if (!isValid) return
        const result = await updateCostCentre(editData)
        if (result?.success) {
            toasts.updated()
            closeDialog()
        } else {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: result?.error || t('common.unknownError'), life: TOAST_LIFE.ERROR })
        }
    }

    // Filter cost centres for mobile search
    const filteredCostCentres = costCentres?.filter(cc => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            String(cc.cost_centre_code || '').toLowerCase().includes(q) ||
            cc.description?.toLowerCase().includes(q) ||
            cc.department?.department_name?.toLowerCase().includes(q)
        )
    }) || []

    // Mobile card view
    const mobileCardView = (
        <div className="admin-mobile-container">
            <div className="admin-mobile-search">
                <DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />
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
                                    onClick={() => openDialog(cc)}
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
                header={<DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />} emptyMessage={t('common.noResults')}
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
            <MobileEditDialog visible={editDialog} header={t('costCentre.editCostCentre', 'Edit Cost Centre')} onHide={closeDialog} onSave={handleMobileEditSave}>
                {editData && (
                    <div className="flex flex-col gap-4">
                        <Select name="department_id" label={t('users.department')} value={editData.department_id} options={departmentOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => updateField('department_id', e.value)} />
                        <Input name="cost_centre_code" label={t('teams.code')} value={editData.cost_centre_code || ''} errors={editErrors}
                            onChange={(e) => updateField('cost_centre_code', e.target.value)} />
                        <Select name="active_status_id" label={t('common.status')} value={editData.active_status_id} options={statusOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => updateField('active_status_id', e.value)} />
                        <Input name="description" label={t('costCentre.description', 'Description')} value={editData.description || ''} errors={editErrors}
                            onChange={(e) => updateField('description', e.target.value)} />
                    </div>
                )}
            </MobileEditDialog>
        </>
    )
}

export default CostCentresPage