import React, { useEffect, useState, useRef, useCallback } from 'react'
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
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { useIsMobile } from '../../hooks/useIsMobile.js'

function UsersPage() {
    const { t } = useTranslation()
    const toastRef = useRef(null)
    const isMobile = useIsMobile()

    const usersState = useUser()
    const { deleteUser, updateUser, refresh } = useUserDispatch()

    // Mobile edit dialog state
    const [editDialog, setEditDialog] = useState(false)
    const [editData, setEditData] = useState(null)

    // Controlled row editing state (preserves edit mode across re-renders)
    const [editingRows, setEditingRows] = useState({})
    // Tracks department changes per editing row: { [userId]: departmentId }
    const [editingDepartmentMap, setEditingDepartmentMap] = useState({})

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

    // Sync local users state whenever the context state changes
    useEffect(() => {
        if (usersState && Array.isArray(usersState.users)) {
            setUsers(usersState.users)
        } else if (Array.isArray(usersState)) {
            setUsers(usersState)
        }
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

    // Editor for text input fields
    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

    // Dropdown editor for teams field (multi-select)
    const teamsEditor = useCallback((editorOptions) => {
        const rowKey = editorOptions.rowData?.user_id;
        // Use editingDepartmentMap if available (user changed department during this edit session)
        const departmentId = rowKey != null && editingDepartmentMap[rowKey] !== undefined
            ? editingDepartmentMap[rowKey]
            : editorOptions.rowData?.department_id || null;
        const filteredTeams = departmentId
            ? lookups.teams.filter(team => team.department_id === departmentId)
            : [];

        let value = editorOptions.value;
        if (!value && Array.isArray(editorOptions.rowData?.teams)) {
            value = editorOptions.rowData.teams.map(t => t.team_id || t.value || t);
        } else if (Array.isArray(value)) {
            value = value.map(t => (typeof t === 'object' && t !== null ? t.team_id || t.value : t));
        } else if (!value) {
            value = [];
        }

        // If department was changed during this edit, filter out teams that no longer belong
        if (rowKey != null && editingDepartmentMap[rowKey] !== undefined) {
            const validTeamIds = new Set(filteredTeams.map(ft => ft.team_id));
            value = value.filter(tid => validTeamIds.has(tid));
        }

        return (
            <MultiSelect
                value={value}
                onChange={(e) => editorOptions.editorCallback(e.target.value)}
                options={filteredTeams.map(option => ({ label: option.team_name, value: option.team_id }))}
                optionLabel="label"
                optionValue="value"
                maxSelectedLabels={2}
                placeholder={departmentId ? t('users.selectTeam', 'Select team') : t('users.selectDepartmentFirst', 'Select department first')}
                disabled={!departmentId}
                className="w-full"
            />
        );
    }, [editingDepartmentMap, lookups.teams, t])

    // Dropdown editor for roles field
    const roleEditor = useCallback((editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={roleOptions}
            optionLabel="label"
            optionValue="value"
        />
    ), [roleOptions])

    // Dropdown editor for department field
    const departmentEditor = useCallback((editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => {
                const newDeptId = e.target.value;
                editorOptions.editorCallback(newDeptId);
                // Track department change so teamsEditor can react
                const rowKey = editorOptions.rowData?.user_id;
                if (rowKey != null) {
                    setEditingDepartmentMap(prev => ({ ...prev, [rowKey]: newDeptId }));
                }
            }}
            options={departmentOptions}
            optionLabel="label"
            optionValue="value"
        />
    ), [departmentOptions])

    // Dropdown editor for status field
    const statusEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={statusOptions}
        />
    )

    // Controlled editing rows change handler
    const onRowEditChange = useCallback((e) => {
        setEditingRows(e.data)
    }, [])

    // Called when a row is edited and saved
    const onRowEditComplete = useCallback((e) => {
        let _users = [...users]
        let { newData, index } = e

        // Clean up editing department tracking for this row
        const rowKey = newData.user_id;
        setEditingDepartmentMap(prev => {
            const next = { ...prev };
            delete next[rowKey];
            return next;
        });

        _users[index] = newData
        setUsers(_users)
            ; (async () => {
                try {
                    const updatePayload = {
                        user_id: newData.user_id,
                        first_name: newData.first_name,
                        last_name: newData.last_name,
                        email: newData.email,
                        department_id: newData.department_id,
                        role_id: newData.role_id,
                        active_status_id: newData.active_status_id,
                        team_ids: Array.isArray(newData.teams)
                            ? newData.teams.map(t => t.team_id || t.value || t)
                            : [],
                    }
                    Object.keys(updatePayload).forEach(key =>
                        updatePayload[key] === undefined && delete updatePayload[key]
                    )

                    await updateUser(updatePayload)
                    await refresh()

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
                    if (toastRef.current) {
                        toastRef.current.show({
                            severity: 'error',
                            summary: t('common.error', 'Error'),
                            detail: err.message || t('users.updateError', 'Failed to update user'),
                            life: 4000
                        })
                    }
                    setUsers(users)
                }
            })()
    }, [users, updateUser, refresh, t])

    // Called when row edit is cancelled
    const onRowEditCancel = useCallback((e) => {
        const rowKey = e.data?.user_id;
        if (rowKey != null) {
            setEditingDepartmentMap(prev => {
                const next = { ...prev };
                delete next[rowKey];
                return next;
            });
        }
    }, [])

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        try {
            const updatePayload = {
                user_id: editData.user_id,
                first_name: editData.first_name,
                last_name: editData.last_name,
                email: editData.email,
                department_id: editData.department_id,
                role_id: editData.role_id,
                active_status_id: editData.active_status_id,
                team_ids: Array.isArray(editData.teams)
                    ? editData.teams.map(t => t.team_id || t.value || t)
                    : [],
            }
            Object.keys(updatePayload).forEach(key =>
                updatePayload[key] === undefined && delete updatePayload[key]
            )
            await updateUser(updatePayload)
            await refresh()
            if (toastRef.current) {
                toastRef.current.show({
                    severity: 'success',
                    summary: t('common.success', 'Success'),
                    detail: t('users.updateSuccess', 'User updated successfully'),
                    life: 3000
                })
            }
        } catch (err) {
            if (toastRef.current) {
                toastRef.current.show({
                    severity: 'error',
                    summary: t('common.error', 'Error'),
                    detail: err.message || t('users.updateError', 'Failed to update user'),
                    life: 4000
                })
            }
        }
        setEditDialog(false)
        setEditData(null)
    }

    // Render the table header
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
    const MobileCardView = () => (
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
                                            setEditData({
                                                ...user,
                                                teams: user.teams?.map(t => t.team_id || t.value || t) || []
                                            })
                                            setEditDialog(true)
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

    // Desktop table view
    const DesktopTableView = () => (
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
                editingRows={editingRows}
                onRowEditChange={onRowEditChange}
                onRowEditComplete={onRowEditComplete}
                onRowEditCancel={onRowEditCancel}
                dataKey="user_id"
                sortMode="multiple"
                removableSort
                scrollable
                tableStyle={{ minWidth: '60rem' }}
            >
                <Column field="user_id" header={t('users.userId', 'User #')} sortable />
                <Column field="first_name" header={t('users.firstName')} sortable editor={textInputEditor} />
                <Column field="last_name" header={t('users.lastName')} sortable editor={textInputEditor} />
                <Column field="department_id" header={t('users.department')} body={renderDepartment} sortable editor={departmentEditor} />
                <Column field="teams" header={t('users.teams', 'Teams')} body={renderTeams} editor={teamsEditor} sortable />
                <Column field="email" header={t('users.email', "Email")} sortable editor={textInputEditor} />
                <Column field="role_id" header={t('users.role')} body={renderRole} sortable editor={roleEditor} />
                <Column field="active_status_id" header={t('user.status', 'Status')} body={renderStatus} sortable editor={statusEditor} />
                <Column rowEditor header={t('common.actions')} />
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

            {isMobile ? <MobileCardView /> : <DesktopTableView />}

            {/* Mobile Edit Dialog */}
            <Dialog
                header={t('users.editUser', 'Edit User')}
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
                            <label>{t('users.firstName')}</label>
                            <InputText
                                value={editData.first_name || ''}
                                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('users.lastName')}</label>
                            <InputText
                                value={editData.last_name || ''}
                                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('users.email', 'Email')}</label>
                            <InputText
                                value={editData.email || ''}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('users.department')}</label>
                            <Dropdown
                                value={editData.department_id}
                                onChange={(e) => setEditData({ ...editData, department_id: e.target.value, teams: [] })}
                                options={departmentOptions}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('users.teams', 'Teams')}</label>
                            <MultiSelect
                                value={editData.teams || []}
                                onChange={(e) => setEditData({ ...editData, teams: e.value })}
                                options={getMobileTeamOptions(editData.department_id)}
                                optionLabel="label"
                                optionValue="value"
                                display="chip"
                                placeholder={editData.department_id ? t('users.selectTeam', 'Select team') : t('users.selectDepartmentFirst', 'Select department first')}
                                disabled={!editData.department_id}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('users.role')}</label>
                            <Dropdown
                                value={editData.role_id}
                                onChange={(e) => setEditData({ ...editData, role_id: e.target.value })}
                                options={roleOptions}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('user.status', 'Status')}</label>
                            <Dropdown
                                value={editData.active_status_id}
                                onChange={(e) => setEditData({ ...editData, active_status_id: e.target.value })}
                                options={statusOptions}
                            />
                        </div>
                    </>
                )}
            </Dialog>
        </>
    )
}

export default UsersPage
