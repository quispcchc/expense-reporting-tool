import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewDepartment from '../../components/feature/department/AddNewDepartment.jsx'
import { DataTable } from 'primereact/datatable'
import { useDepartment } from '../../contexts/DepartmentContext.jsx'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { InputText } from 'primereact/inputtext'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { FilterMatchMode } from 'primereact/api'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'

function DepartmentsPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Access global department state and actions from context
    const { state: { departments, loading }, actions: { updateDepartment, deleteDepartment } } = useDepartment()
    const { lookups, refreshLookups } = useLookups()
    const toast = useRef(null)

    // Get active statuses from lookups
    const statusOptions = lookups.activeStatuses.map(s => ({
        label: s.active_status_name,
        value: s.active_status_id
    }))

    // State for global filter input and DataTable filters
    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Handle global search input changes
    const onGlobalFilterChange = (e) => {
        const value = e.target.value
        let _filters = { ...filters }
        _filters['global'].value = value
        setFilters(_filters)
        setGlobalFilterValue(value)
    }

    // Custom renderer to display the status badge/tab
    const renderStatus = (rowData) => {
        // Use the eager-loaded active_status relation from API response
        const statusName = rowData.active_status?.active_status_name || 'Unknown'
        return <StatusTab status={statusName} />
    }

    // Text input editor used when editing 'code' and 'name' fields
    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

    // Dropdown editor used when editing the 'status' field
    const statusEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.value)}
            options={statusOptions}
            optionLabel="label"
            optionValue="value"
            placeholder={t('filter.selectOne')}
        />
    )

    // Handle row edit completion: update department via context action
    const onRowEditComplete = async (e) => {
        const { newData } = e
        await updateDepartment(newData)
        // Refresh lookups so other pages (like Create Claim) get updated data
        await refreshLookups()
    }

    // Navigate to department's teams page
    const handleManageTeams = (rowData) => {
        navigate(`/admin/departments/${rowData.department_id}/teams`)
    }

    // Handle delete department with confirmation
    const handleDelete = (rowData) => {
        confirmDialog({
            message: t('departments.deleteConfirmMessage', { name: rowData.department_name }),
            header: t('departments.deleteConfirmTitle'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await deleteDepartment(rowData.department_id)
                if (result.success) {
                    toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('departments.deleteSuccess'), life: 3000 })
                    // Refresh lookups so other pages (like Create Claim) get updated data
                    await refreshLookups()
                } else {
                    toast.current?.show({ severity: 'error', summary: t('common.error'), detail: result.error, life: 5000 })
                }
            },
        })
    }

    // Delete button template
    const deleteTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                tooltip={t('common.delete')}
                tooltipOptions={{ position: 'top' }}
                onClick={() => handleDelete(rowData)}
            />
        )
    }

    // Combined actions column template (Delete + Manage Teams)
    const combinedActionsTemplate = (rowData) => {
        return (
            <div className="flex gap-0 justify-center">
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    tooltip={t('common.delete')}
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => handleDelete(rowData)}
                />
                <Button
                    icon="pi pi-users"
                    rounded
                    text
                    severity="info"
                    tooltip={t('departments.manageTeams')}
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => handleManageTeams(rowData)}
                />
            </div>
        )
    }

    // Render the search bar above the DataTable
    const renderHeader = () => {
        return (
            <div className="flex justify-end">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder={t('common.keywordSearch')}
                    />
                </IconField>
            </div>
        )
    }

    return (
        <>
            {/* Page title and navigation */}
            <ContentHeader title={t('departments.title')} homePath="/admin" iconKey="sidebar.teams" />
            {/* Add new department form component */}
            <AddNewDepartment />
            <div className="bg-white rounded-xl p-6 mt-5">
                {/* DataTable for listing and editing departments */}
                <DataTable
                    value={departments}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    editMode="row"
                    onRowEditComplete={onRowEditComplete}
                    filters={filters}
                    globalFilterFields={['department_abbreviation', 'department_name', 'active_status_id']}
                    header={renderHeader()}
                    emptyMessage={t('common.noResults')}
                    sortMode="multiple"
                    removableSort
                    loading={loading}
                >
                    {/* Columns with inline editing */}
                    <Column field="department_abbreviation" header={t('departments.code')} sortable editor={textInputEditor}></Column>
                    <Column field="department_name" header={t('departments.name')} sortable editor={textInputEditor} body={(rowData) => (
                        <span
                            className="text-brand-primary hover:underline cursor-pointer"
                            onClick={() => navigate(`/admin/departments/${rowData.department_id}/teams`)}
                        >
                            {rowData.department_name}
                        </span>
                    )}></Column>
                    <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable editor={statusEditor}></Column>
                    <Column rowEditor={true} header={t('common.edit')} headerStyle={{ width: '4rem', minWidth: '4rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column header={t('common.actions')} body={combinedActionsTemplate} headerStyle={{ width: '5rem', minWidth: '5rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
                <ConfirmDialog />
                <Toast ref={toast} />
            </div>
        </>
    )
}

export default DepartmentsPage
