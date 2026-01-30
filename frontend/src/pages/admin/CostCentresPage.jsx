import React, { useEffect, useRef, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewCostCentre from '../../components/feature/costCentre/AddNewCostCentre.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useCostCentre } from '../../contexts/CostCentreContext.jsx'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { ProgressSpinner } from 'primereact/progressspinner'

import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'
import { useTranslation } from 'react-i18next'

function CostCentresPage() {
    const { t } = useTranslation()
    const { lookups } = useLookups()

    // Destructure state and actions from the custom hook
    const {
        state: { costCentres, loading, error },
        actions: { updateCostCentre, deleteCostCentre },
    } = useCostCentre()

    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })
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

    const departmentEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.value)}
            options={lookups.departments.map(department => ({
                label: department.department_name,
                value: department.department_id,
            }))}
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
            options={lookups.activeStatuses.map(status => ({
                label: status.active_status_name,
                value: status.active_status_id,
            }))}
        />
    )

    //Feedback message displayed after certain action (Create,Delete,Update)
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
            console.log(response)
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
        // show error message
        if (error) {
            toasts.error()
        }
    }, [error])

    const onRowEditComplete = async (e) => {
        const response = await updateCostCentre(e.newData)
        if (response?.success) {
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

    return (
        <>
            {loading && (
                <div className="absolute inset-0 flex justify-center items-center z-10">
                    <ProgressSpinner />
                </div>
            )}
            <Toast ref={toast} />
            <ConfirmDialog />
            <ContentHeader title={t('sidebar.costCentre')} homePath="/admin" iconKey="sidebar.costCentre" />
            <AddNewCostCentre createdToast={toasts.created} />
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
                    sortMode="multiple" removableSort>
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
        </>
    )
}

export default CostCentresPage