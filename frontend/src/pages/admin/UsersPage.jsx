import React, { useEffect, useState, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewUser from '../../components/feature/user/AddNewUser.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useUser, useUserDispatch } from '../../contexts/UserContext.jsx'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { FilterMatchMode } from 'primereact/api'
import { InputIcon } from 'primereact/inputicon'
import { IconField } from 'primereact/iconfield'
import { MultiSelect } from 'primereact/multiselect'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

function UsersPage() {
    const { t } = useTranslation()
    const toastRef = useRef(null)

    const usersState = useUser()
    const { deleteUser, updateUser, refresh } = useUserDispatch()

    // Delete user with confirmation dialog
    const handleDeleteUser = (rowData) => {
        confirmDialog({
            message: t('users.deleteConfirmMessage', 'Are you sure you want to delete this user? This action cannot be undone.'),
            header: t('users.deleteConfirmTitle', 'Delete User'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await deleteUser(rowData.user_id)
                    await refresh()
                    if (toastRef.current) {
                        toastRef.current.show({
                            severity: 'success',
                            summary: t('common.success', 'Success'),
                            detail: t('users.deleteSuccess', 'User deleted successfully'),
                            life: 3000
                        })
                    }
                } catch (err) {
                    if (toastRef.current) {
                        toastRef.current.show({
                            severity: 'error',
                            summary: t('common.error', 'Error'),
                            detail: err.message || t('users.deleteError', 'Failed to delete user'),
                            life: 4000
                        })
                    }
                }
            },
            reject: () => { },
        })
    }
    // Render delete button for each row
    const renderDeleteButton = (rowData) => (
        <button
            className="p-button p-button-danger p-button-rounded p-button-text"
            title={t('common.delete')}
            onClick={() => handleDeleteUser(rowData)}
        >
            <span className="pi pi-trash" />
        </button>
    )

    // Local state to manage the current list of users
    const [users, setUsers] = useState(null)

    const { lookups } = useLookups()
    console.log(lookups)

    // Sync local users state whenever the context state changes
    useEffect(() => {
        setUsers(usersState)
        console.log(usersState)
    }, [usersState])

    // States for global search filter
    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Handle global filter input change
    const onGlobalFilterChange = (e) => {
        const value = e.target.value
        let _filters = { ...filters }
        _filters['global'].value = value

        setFilters(_filters)
        setGlobalFilterValue(value)
    }

    // Get teams and roles from lookups
    const teamOptions = lookups.teams.map(t => ({ label: t.team_name, value: t.team_id }))
    const roleOptions = lookups.roles.map(r => ({ label: r.role_name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), value: r.role_id }))
    const statusOptions = lookups.activeStatuses.map(s => ({ label: s.active_status_name, value: s.active_status_id }))
    const departmentOptions = lookups.departments.map(d => ({ label: d.department_name, value: d.department_id }))
    // Render custom UI for user status
    const renderStatus = (rowData) => (<ActiveStatusTab status={rowData.status} />)

    // Render department name (as formatted badge)
    const renderDepartment = (rowData) => {
        console.log('rowdata', rowData)
        if (!rowData.department_id) return ''

        const dept = departmentOptions.find(d => d.value === rowData.department_id)
        return (
            <span>
                {dept ? dept.label : ''}
            </span>
        )
    }

    // Render list of roles (as formatted badges)
    const renderRole = (rowData) => {
        if (!rowData.role_id) return ''

        const role = roleOptions.find(r => r.value === rowData.role_id)
        return role ? role.label : ''
    }



    // Render list of teams (as formatted badges)
    const renderTeams = (rowData) => {
        if (!rowData.teams || rowData.teams.length === 0) return ''
        return (
            <span>
                {rowData.teams
                    .map(team => team.team_abbreviation || team.label || team)
                    .join(', ')}
            </span>
        )
    }



    // Editor for text input fields (first name, last name, etc.)
    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )



    // Dropdown editor for teams field (multi-select), filtered by department
    const teamsEditor = (editorOptions) => {
        // Find department for this row (edit mode: editorOptions.rowData, add mode: editorOptions.value)
        const departmentId = editorOptions.rowData?.department_id || null;
        const filteredTeams = departmentId
            ? lookups.teams.filter(team => team.department_id === departmentId)
            : [];

        // Normalize value to array of team IDs for MultiSelect
        let value = editorOptions.value;
        if (!value && Array.isArray(editorOptions.rowData?.teams)) {
            value = editorOptions.rowData.teams.map(t => t.team_id || t.value || t);
        } else if (Array.isArray(value)) {
            value = value.map(t => (typeof t === 'object' && t !== null ? t.team_id || t.value : t));
        } else if (!value) {
            value = [];
        }

        return (
            <MultiSelect
                value={value}
                onChange={(e) => editorOptions.editorCallback(e.target.value)}
                options={filteredTeams.map(option => ({ label: option.team_name, value: option.team_id }))}
                optionLabel="label"
                optionValue="value"
                display="chip"
                placeholder={departmentId ? t('users.selectTeam', 'Select team') : t('users.selectDepartmentFirst', 'Select department first')}
                disabled={!departmentId}
                className="w-full"
            />
        );
    }

    // Dropdown editor for roles field
    const roleEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={roleOptions}
            optionLabel="label"
            optionValue="value"
        />
    )

    // Dropdown editor for department field
    const departmentEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={departmentOptions}
            optionLabel="label"
            optionValue="value"
        />
    )

    // Dropdown editor for status field
    const statusEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={statusOptions}
        />
    )

    // Called when a row is edited and saved
    const onRowEditComplete = (e) => {
        let _users = [...users]
        let { newData, index } = e

        _users[index] = newData
        setUsers(_users)
            // Persist update to backend via context action
            ; (async () => {
                try {
                    // Map frontend field names to backend field names
                    const updatePayload = {
                        user_id: newData.user_id,
                        first_name: newData.first_name,
                        last_name: newData.last_name,
                        email: newData.email,
                        department_id: newData.department_id,
                        role_id: newData.role_id,
                        active_status_id: newData.status,
                        team_ids: Array.isArray(newData.teams)
                            ? newData.teams.map(t => t.team_id || t.value || t)
                            : [],
                    }
                    // Remove undefined values
                    Object.keys(updatePayload).forEach(key =>
                        updatePayload[key] === undefined && delete updatePayload[key]
                    )
                    await updateUser(updatePayload)
                    await refresh(); // Refresh user list from backend
                    // Show success toast
                    if (toastRef.current) {
                        toastRef.current.show({
                            severity: 'success',
                            summary: t('common.success', 'Success'),
                            detail: t('users.updateSuccess', 'User updated successfully'),
                            life: 3000
                        })
                    }
                } catch (err) {
                    console.error('Failed to update user', err)
                    // Show error toast
                    if (toastRef.current) {
                        toastRef.current.show({
                            severity: 'error',
                            summary: t('common.error', 'Error'),
                            detail: err.message || t('users.updateError', 'Failed to update user'),
                            life: 4000
                        })
                    }
                    // Revert the UI change
                    setUsers(users)
                }
            })()
    }



    // Render the table header, including the global search bar
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
            <Toast ref={toastRef} />
            <ConfirmDialog />

            {/* Page title/header */}
            <ContentHeader title={t('users.title')} homePath="/admin" iconKey="sidebar.users" />

            {/* Add new user component (e.g. modal or inline form) */}
            <AddNewUser />

            {/* User data table */}
            <div className="bg-white rounded-xl p-6 mt-5">
                <DataTable
                    value={users}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    filters={filters}
                    globalFilterFields={[
                        'user_id', 'first_name', 'last_name',
                        'department', 'position', 'role', 'status',
                    ]}
                    header={renderHeader}
                    emptyMessage={t('common.noResults')}
                    editMode="row"
                    onRowEditComplete={onRowEditComplete}
                    sortMode="multiple"
                    removableSort
                >
                    {/* Each column definition below */}
                    <Column field="user_id" header={t('users.userId', 'User #')} sortable />
                    <Column field="first_name" header={t('users.firstName')} sortable editor={textInputEditor} />
                    <Column field="last_name" header={t('users.lastName')} sortable editor={textInputEditor} />

                    <Column field="department_id" header={t('users.department')} body={renderDepartment} sortable editor={departmentEditor} />
                    <Column field="teams" header={t('users.teams', 'Teams')} body={renderTeams} editor={teamsEditor} sortable />

                    <Column field="email" header={t('users.email', "Email")} sortable editor={textInputEditor} />
                    {/*<Column field="position" header="Position" sortable editor={ textInputEditor }/>*/}
                    <Column field="role_id" header={t('users.role')} body={renderRole} sortable editor={roleEditor} />
                    <Column field="status" header={t('user.status', 'Status')} body={renderStatus} sortable editor={statusEditor} />

                    {/* Edit/save and delete button columns */}
                    <Column rowEditor header={t('common.actions')} />
                    <Column body={renderDeleteButton} header={t('common.delete', 'Delete')} style={{ width: '6rem', textAlign: 'center' }} />
                    
                </DataTable>
            </div>
        </>
    )
}

export default UsersPage
