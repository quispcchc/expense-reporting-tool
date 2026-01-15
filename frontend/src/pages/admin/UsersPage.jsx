import React, { useEffect, useState, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewUser from '../../components/feature/user/AddNewUser.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useUser, useUserDispatch } from '../../contexts/UserContext.jsx'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
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

function UsersPage() {
    const { t } = useTranslation()
    const toastRef = useRef(null)
    
    // Get user state and dispatch from context
    const usersState = useUser()
    const { updateUser } = useUserDispatch()

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
    const teamOptions = lookups.teams.map(t => ({label: t.team_name, value: t.team_id}))
    const roleOptions = lookups.roles.map(r => ({label: r.role_name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), value: r.role_id}))
    const statusOptions = lookups.activeStatuses.map(s => ({label: s.active_status_name ,value: s.active_status_id}))
    const departmentOptions = lookups.departments.map(d => ({label: d.department_name, value: d.department_id}))
    // Render custom UI for user status
    const renderStatus = (rowData) => (<ActiveStatusTab status={rowData.status} />)
    
    // Render department name (as formatted badge)
    const renderDepartment = (rowData) => {
        console.log('rowdata',rowData)
        if (!rowData.department_id) return ''
        
        const dept = departmentOptions.find(d => d.value === rowData.department_id)
        return (
            <span>
                { dept ? dept.label : '' }
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
        
        const formatTeam = (team) => {
            if (typeof team === 'string') {
                return team.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
            }
            return team.name || team
        }
        
        return (
            <div className="flex gap-2 flex-wrap">
                {rowData.teams.map((team, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {formatTeam(team)}
                    </span>
                ))}
            </div>
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



    // Dropdown editor for team field
    const teamEditor = (editorOptions) => (
        <MultiSelect
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={teamOptions}
            optionLabel="label"
            optionValue="value"
        />
    )

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
            value={editorOptions.value }
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
                        // team_id: newData.team,
                        active_status_id: newData.status,
                        department_id: newData.department_id,
                    }
                    
                    // Remove undefined values
                    Object.keys(updatePayload).forEach(key => 
                        updatePayload[key] === undefined && delete updatePayload[key]
                    )
                    
                    await updateUser(updatePayload)
                    
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
                    {/* <Column field="team" header={t('users.team')} sortable editor={teamEditor} /> */}

                    <Column field="email" header={t('users.email',"Email")} sortable editor={textInputEditor} />
                    {/*<Column field="position" header="Position" sortable editor={ textInputEditor }/>*/}
                    <Column field="role_id" header={t('users.role')} body={renderRole} sortable editor={ roleEditor }/>
                    <Column field="status" header={t('user.status','Status')} body={ renderStatus } sortable editor={ statusEditor }/>

                    {/* Edit/save button column */}
                    <Column rowEditor header={t('common.actions')} />
                </DataTable>
            </div>
        </>
    )
}

export default UsersPage
