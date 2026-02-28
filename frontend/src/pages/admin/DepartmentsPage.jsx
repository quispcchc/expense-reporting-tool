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
import { Dialog } from 'primereact/dialog'
import { FilterMatchMode } from 'primereact/api'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { validateForm } from '../../utils/validation/validator.js'
import { validationSchemas } from '../../utils/validation/schemas.js'
import Input from '../../components/common/ui/Input.jsx'
import Select from '../../components/common/ui/Select.jsx'

function DepartmentsPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

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

    // Mobile edit dialog state
    const [editDialog, setEditDialog] = useState(false)
    const [editData, setEditData] = useState(null)
    const [editErrors, setEditErrors] = useState({})

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
        const { isValid, errors: validationErrors } = validateForm(newData, validationSchemas.addDepartment)
        if (!isValid) {
            const messages = Object.values(validationErrors).map(key => t(key)).join(', ')
            toast.current?.show({ severity: 'error', summary: t('common.error'), detail: messages, life: 5000 })
            return
        }
        const result = await updateDepartment(newData)
        if (result?.success) {
            toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('departments.updateSuccess', 'Department updated'), life: 3000 })
            await refreshLookups()
        } else {
            toast.current?.show({ severity: 'error', summary: t('common.error'), detail: result?.error || t('errors.permissionDenied'), life: 5000 })
        }
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
                    await refreshLookups()
                } else {
                    toast.current?.show({ severity: 'error', summary: t('common.error'), detail: result.error, life: 5000 })
                }
            },
        })
    }

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        const { isValid, errors: validationErrors } = validateForm(editData, validationSchemas.addDepartment)
        if (!isValid) {
            setEditErrors(validationErrors)
            return
        }
        setEditErrors({})
        const result = await updateDepartment(editData)
        if (result?.success) {
            await refreshLookups()
            toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('departments.updateSuccess', 'Department updated'), life: 3000 })
            setEditDialog(false)
            setEditData(null)
        } else {
            toast.current?.show({ severity: 'error', summary: t('common.error'), detail: result?.error || t('errors.permissionDenied'), life: 5000 })
        }
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

    // Filter departments for mobile search
    const filteredDepartments = departments?.filter(dept => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            dept.department_abbreviation?.toLowerCase().includes(q) ||
            dept.department_name?.toLowerCase().includes(q)
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
                {filteredDepartments.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredDepartments.map(dept => {
                        const statusName = dept.active_status?.active_status_name || 'Unknown'
                        return (
                            <div key={dept.department_id} className="admin-card">
                                <div className="admin-card-header">
                                    <div>
                                        <div className="admin-card-title">{dept.department_name}</div>
                                        <div className="admin-card-subtitle">{dept.department_abbreviation}</div>
                                    </div>
                                    <StatusTab status={statusName} />
                                </div>
                                <div className="admin-card-actions">
                                    <Button
                                        icon="pi pi-users"
                                        label={t('departments.manageTeams')}
                                        size="small"
                                        text
                                        onClick={() => handleManageTeams(dept)}
                                    />
                                    <Button
                                        icon="pi pi-pencil"
                                        size="small"
                                        text
                                        onClick={() => {
                                            setEditData({ ...dept })
                                            setEditDialog(true)
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        size="small"
                                        text
                                        severity="danger"
                                        onClick={() => handleDelete(dept)}
                                    />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )

    // Desktop table view
    const desktopTableView = (
        <div className="bg-white rounded-xl p-6 mt-5">
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
                scrollable
                tableStyle={{ minWidth: '40rem' }}
            >
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
        </div>
    )

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            {/* Page title and navigation */}
            <ContentHeader title={t('departments.title')} homePath="/admin" iconKey="sidebar.teams" />
            {/* Add new department form component */}
            <AddNewDepartment toastRef={toast} />

            {isMobile ? mobileCardView : desktopTableView}

            {/* Mobile Edit Dialog */}
            <Dialog
                header={t('departments.editDepartment', 'Edit Department')}
                visible={editDialog}
                style={{ width: '90vw', maxWidth: '450px' }}
                onHide={() => { setEditDialog(false); setEditData(null); setEditErrors({}) }}
                className="mobile-edit-dialog"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={() => { setEditDialog(false); setEditData(null); setEditErrors({}) }} />
                        <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={handleMobileEditSave} />
                    </div>
                }
            >
                {editData && (
                    <div className="flex flex-col gap-4">
                        <Input name="department_abbreviation" label={t('departments.code')} value={editData.department_abbreviation || ''} errors={editErrors}
                            onChange={(e) => { setEditData({ ...editData, department_abbreviation: e.target.value }); setEditErrors(prev => ({ ...prev, department_abbreviation: undefined })) }} />
                        <Input name="department_name" label={t('departments.name')} value={editData.department_name || ''} errors={editErrors}
                            onChange={(e) => { setEditData({ ...editData, department_name: e.target.value }); setEditErrors(prev => ({ ...prev, department_name: undefined })) }} />
                        <Select name="active_status_id" label={t('common.status')} value={editData.active_status_id} options={statusOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => { setEditData({ ...editData, active_status_id: e.value }); setEditErrors(prev => ({ ...prev, active_status_id: undefined })) }} />
                    </div>
                )}
            </Dialog>
        </>
    )
}

export default DepartmentsPage
