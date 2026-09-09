import React, { useEffect, useState, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewUser from '../../components/feature/user/AddNewUser.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useUser, useUserDispatch } from '../../contexts/UserContext.jsx'
import { MultiSelect } from 'primereact/multiselect'
import { Button } from 'primereact/button'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'
import Input from '../../components/common/ui/Input.jsx'
import Select from '../../components/common/ui/Select.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { useDataTableFilter } from '../../hooks/useDataTableFilter.js'
import { useMobileEditDialog } from '../../hooks/useMobileEditDialog.js'
import DataTableSearchHeader from '../../components/common/ui/DataTableSearchHeader.jsx'
import MobileEditDialog from '../../components/common/ui/MobileEditDialog.jsx'
import { showToast, TOAST_LIFE } from '../../utils/helpers.js'
import { validationSchemas } from '../../utils/validation/schemas.js'

import { InputSwitch } from 'primereact/inputswitch'
import { ROLE_LEVEL } from '../../config/constants.js'

function UsersPage() {
    const { t } = useTranslation()
    const toastRef = useRef(null)
    const isMobile = useIsMobile()

    const usersState = useUser()
    const { deleteUser, updateUser, refresh } = useUserDispatch()

    const { editDialog, editData, editErrors, openDialog, closeDialog, updateField, validate, setEditData } = useMobileEditDialog({ validationSchema: validationSchemas.editUser })

    // Delete user with confirmation dialog
    const handleDeleteUser = (rowData) => {
        confirmDialog({
            message: t('users.deleteConfirmMessage', 'Are you sure you want to delete this user? This action cannot be undone.'),
            header: t('users.deleteConfirmTitle', 'Delete User'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const result = await deleteUser(rowData.user_id)
                if (result?.success) {
                    await refresh()
                    showToast(toastRef, { severity: 'success', summary: t('common.success'), detail: t('users.deleteSuccess', 'User deleted successfully'), life: TOAST_LIFE.SUCCESS })
                } else {
                    showToast(toastRef, { severity: 'error', summary: t('common.error'), detail: result?.error || t('users.deleteError', 'Failed to delete user'), life: TOAST_LIFE.ERROR })
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

    // Sync local users state whenever the context state changes
    useEffect(() => {
        if (usersState && Array.isArray(usersState.users)) {
            setUsers(usersState.users)
        } else if (Array.isArray(usersState)) {
            setUsers(usersState)
        }
    }, [usersState])

    const { globalFilterValue, filters, onGlobalFilterChange } = useDataTableFilter()

    // Get teams and roles from lookups
    const roleOptions = lookups.roles.map(r => ({ label: r.role_name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), value: r.role_id }))
    const statusOptions = lookups.activeStatuses.map(s => ({ label: s.active_status_name, value: s.active_status_id }))
    const departmentOptions = lookups.departments.map(d => ({ label: d.department_name, value: d.department_id }))

    // Render custom UI for user status
    const renderStatus = (rowData) => (<ActiveStatusTab status={rowData.active_status_id} />)

    // Render department name
    const renderDepartment = (rowData) => {
        if (!rowData.department_id) return ''
        const dept = departmentOptions.find(d => d.value === rowData.department_id)
        return (<span>{dept ? dept.label : ''}</span>)
    }

    // Render role
    const renderRole = (rowData) => {
        if (!rowData.role_id) return ''
        const role = roleOptions.find(r => r.value === rowData.role_id)
        return role ? role.label : ''
    }

    // Render teams
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

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        const { isValid } = validate()
        if (!isValid) return

        // Check if selected role is admin-level for self-approve
        const selectedRole = lookups.roles.find(r => r.role_id === editData.role_id)
        const isAdminRole = selectedRole && selectedRole.role_level <= ROLE_LEVEL.DEPARTMENT_MANAGER

        const updatePayload = {
            user_id: editData.user_id,
            first_name: editData.first_name,
            last_name: editData.last_name,
            email: editData.email,
            department_id: editData.department_id,
            role_id: editData.role_id,
            active_status_id: editData.active_status_id,
            can_self_approve: isAdminRole ? !!editData.can_self_approve : false,
            team_ids: Array.isArray(editData.teams)
                ? editData.teams.map(t => t.team_id || t.value || t)
                : [],
        }
        Object.keys(updatePayload).forEach(key =>
            updatePayload[key] === undefined && delete updatePayload[key]
        )
        const result = await updateUser(updatePayload)
        if (result?.success) {
            await refresh()
            showToast(toastRef, { severity: 'success', summary: t('common.success'), detail: t('users.updateSuccess', 'User updated successfully'), life: TOAST_LIFE.SUCCESS })
        } else {
            showToast(toastRef, { severity: 'error', summary: t('common.error'), detail: result?.error || t('users.updateError', 'Failed to update user'), life: TOAST_LIFE.ERROR })
        }
        closeDialog()
    }


    // Filter users for mobile search
    const filteredUsers = users?.filter(user => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            user.first_name?.toLowerCase().includes(q) ||
            user.last_name?.toLowerCase().includes(q) ||
            user.email?.toLowerCase().includes(q) ||
            String(user.user_id).includes(q)
        )
    }) || []

    // Get filtered teams for mobile edit based on department
    const getMobileTeamOptions = (departmentId) => {
        if (!departmentId) return []
        return lookups.teams
            .filter(team => team.department_id === departmentId)
            .map(t => ({ label: t.team_name, value: t.team_id }))
    }

    // Mobile card view
    const mobileCardView = (
        <div className="admin-mobile-container">
            <div className="admin-mobile-search">
                <DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />
            </div>

            <div className="admin-mobile-list">
                {filteredUsers.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredUsers.map(user => {
                        const dept = departmentOptions.find(d => d.value === user.department_id)
                        const role = roleOptions.find(r => r.value === user.role_id)
                        return (
                            <div key={user.user_id} className="admin-card">
                                <div className="admin-card-header">
                                    <div>
                                        <div className="admin-card-title">
                                            {user.first_name} {user.last_name}
                                        </div>
                                        <div className="admin-card-subtitle">{user.email}</div>
                                    </div>
                                    <ActiveStatusTab status={user.active_status_id} />
                                </div>
                                <div className="admin-card-body">
                                    <div className="admin-card-row">
                                        <span className="admin-card-label">{t('users.department')}</span>
                                        <span className="admin-card-value">{dept?.label || '—'}</span>
                                    </div>
                                    <div className="admin-card-row">
                                        <span className="admin-card-label">{t('users.role')}</span>
                                        <span className="admin-card-value">{role?.label || '—'}</span>
                                    </div>
                                    <div className="admin-card-row">
                                        <span className="admin-card-label">{t('users.teams', 'Teams')}</span>
                                        <span className="admin-card-value">
                                            {user.teams?.map(t => t.team_abbreviation || t.label || t).join(', ') || '—'}
                                        </span>
                                    </div>
                                </div>
                                <div className="admin-card-actions">
                                    <Button
                                        icon="pi pi-pencil"
                                        size="small"
                                        text
                                        onClick={() => {
                                            openDialog({
                                                ...user,
                                                teams: user.teams?.map(t => t.team_id || t.value || t) || []
                                            })
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        size="small"
                                        text
                                        severity="danger"
                                        onClick={() => handleDeleteUser(user)}
                                    />
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )

    // Render edit button for desktop
    const renderEditButton = (rowData) => (
        <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text"
            title={t('common.edit')}
            onClick={() => {
                openDialog({
                    ...rowData,
                    teams: rowData.teams?.map(t => t.team_id || t.value || t) || []
                })
            }}
        />
    )

    // Desktop table view
    const desktopTableView = (
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
                header={<DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />}
                emptyMessage={t('common.noResults')}
                dataKey="user_id"
                sortMode="multiple"
                removableSort
                scrollable
                tableStyle={{ minWidth: '60rem' }}
            >
                <Column field="user_id" header={t('users.userId', 'User #')} sortable />
                <Column field="first_name" header={t('users.firstName')} sortable />
                <Column field="last_name" header={t('users.lastName')} sortable />
                <Column field="department_id" header={t('users.department')} body={renderDepartment} sortable />
                <Column field="teams" header={t('users.teams', 'Teams')} body={renderTeams} sortable />
                <Column field="email" header={t('users.email', "Email")} sortable />
                <Column field="role_id" header={t('users.role')} body={renderRole} sortable />
                <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable />
                <Column body={renderEditButton} header={t('common.actions')} style={{ width: '6rem', textAlign: 'center' }} />
                <Column body={renderDeleteButton} header={t('common.delete', 'Delete')} style={{ width: '6rem', textAlign: 'center' }} />
            </DataTable>
        </div>
    )

    return (
        <>
            <Toast ref={toastRef} />
            <ConfirmDialog />

            <ContentHeader title={t('users.title')} homePath="/admin" iconKey="sidebar.users" />
            <AddNewUser />

            {isMobile ? mobileCardView : desktopTableView}

            {/* User Edit Modal */}
            <MobileEditDialog 
                visible={editDialog} 
                header={t('users.editUser', 'Edit User')} 
                onHide={closeDialog} 
                onSave={handleMobileEditSave}
                style={{ width: '90vw', maxWidth: '600px' }}
            >
                {editData && (
                    <div className="flex flex-col gap-4">
                        <Input name="first_name" label={t('users.firstName')} value={editData.first_name || ''} errors={editErrors}
                            onChange={(e) => updateField('first_name', e.target.value)} />
                        <Input name="last_name" label={t('users.lastName')} value={editData.last_name || ''} errors={editErrors}
                            onChange={(e) => updateField('last_name', e.target.value)} />
                        <Input name="email" label={t('users.email', 'Email')} value={editData.email || ''} errors={editErrors}
                            onChange={(e) => updateField('email', e.target.value)} />
                        <Select name="department_id" label={t('users.department')} value={editData.department_id} options={departmentOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => { setEditData(prev => ({ ...prev, department_id: e.value, teams: [] })); }} />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <label className="block text-sm font-medium">{t('users.teams', 'Teams')}</label>
                            </div>
                            <MultiSelect
                                value={editData.teams || []}
                                onChange={(e) => updateField('teams', e.value)}
                                options={getMobileTeamOptions(editData.department_id)}
                                optionLabel="label"
                                optionValue="value"
                                display="chip"
                                className="w-full"
                                placeholder={editData.department_id ? t('users.selectTeam', 'Select team') : t('users.selectDepartmentFirst', 'Select department first')}
                                disabled={!editData.department_id}
                                filter
                            />
                        </div>
                        <Select name="role_id" label={t('users.role')} value={editData.role_id} options={roleOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => updateField('role_id', e.value)} />

                        {/* Self-approve toggle — only for admin-level roles */}
                        {(() => {
                            const selectedRole = lookups.roles.find(r => r.role_id === editData.role_id)
                            const isAdminRole = selectedRole && selectedRole.role_level <= ROLE_LEVEL.DEPARTMENT_MANAGER
                            return isAdminRole ? (
                                <div className="flex items-center gap-2 py-2">
                                    <InputSwitch
                                        inputId="can_self_approve"
                                        checked={!!editData.can_self_approve}
                                        onChange={(e) => updateField('can_self_approve', e.value)}
                                    />
                                    <label htmlFor="can_self_approve" className="text-sm cursor-pointer">
                                        {t('users.canSelfApprove', 'Can self-approve corporate card claims')}
                                    </label>
                                </div>
                            ) : null
                        })()}

                        <Select name="active_status_id" label={t('common.status')} value={editData.active_status_id} options={statusOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => updateField('active_status_id', e.value)} />
                    </div>
                )}
            </MobileEditDialog>
        </>
    )
}

export default UsersPage
