import React, { useEffect, useState } from 'react'
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

function UsersPage() {
    const { t } = useTranslation()
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

    // Render custom UI for user status
    const renderStatus = (rowData) => (
        <StatusTab status={rowData.status} />
    )

    // Render list of roles (as comma-separated string)
    const renderRoles = (rowData) => (
        <p>{Array.isArray(rowData.roles) ? rowData.roles.join(', ') : ''}</p>
    )

    // Render list of teams (as comma-separated string)
    const renderTeams = (rowData) => (
        <p>{Array.isArray(rowData.teams) ? rowData.teams.join(', ') : ''}</p>
    )

    // Editor for text input fields (first name, last name, etc.)
    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

    // Get teams and roles from lookups
    const teamOptions = lookups.teams.map(t => t.code || t.name || t)
    const roleOptions = lookups.roles.map(r => r.name || r)
    const statusOptions = lookups.activeStatuses.map(s => s.name || s)

    // Dropdown editor for team field
    const teamEditor = (editorOptions) => (
        <MultiSelect
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={teamOptions}
        />
    )

    // Dropdown editor for roles field
    const roleEditor = (editorOptions) => (
        <MultiSelect
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={roleOptions}
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
                    await updateUser(newData)
                } catch (err) {
                    console.error('Failed to update user', err)
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
            {/* Page title/header */}
            <ContentHeader title={t('users.title')} homePath="/admin" iconKey="sidebar.users" />

            {/* Add new user component (e.g. modal or inline form) */}
            <AddNewUser />

            {/* User data table */}
            <div className="bg-white rounded-xl p-6 mt-5">
                <DataTable
                    value={usersState}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    filters={filters}
                    globalFilterFields={[
                        'user_id', 'first_name', 'last_name',
                        'team', 'position', 'role', 'status',
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
                    <Column field="teams" header={t('users.team')} body={renderTeams} sortable editor={teamEditor} />
                    {/*<Column field="position" header="Position" sortable editor={ textInputEditor }/>*/}
                    {/*<Column field="roles" header="Role" body={ renderRoles } sortable editor={ roleEditor }/>*/}
                    {/*<Column field="status" header="Status" body={ renderStatus } sortable editor={ statusEditor }/>*/}

                    {/* Edit/save button column */}
                    <Column rowEditor header={t('common.actions')} />
                </DataTable>
            </div>
        </>
    )
}

export default UsersPage
