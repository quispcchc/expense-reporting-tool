import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewTeam from '../../components/feature/team/AddNewTeam.jsx'
import { DataTable } from 'primereact/datatable'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import DataTableSearchHeader from '../../components/common/ui/DataTableSearchHeader.jsx'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { useDataTableFilter } from '../../hooks/useDataTableFilter.js'
import { textInputEditor } from '../../utils/dataTableEditors.jsx'
import api from '../../api/api.js'
import { showToast, TOAST_LIFE } from '../../utils/helpers.js'
import { validateForm } from '../../utils/validation/validator.js'
import { validationSchemas } from '../../utils/validation/schemas.js'
import Input from '../../components/common/ui/Input.jsx'
import Select from '../../components/common/ui/Select.jsx'

// Module-level cache: persists across mount/unmount cycles
// Key: departmentId, Value: { department, teams }
const deptTeamsCache = {}

function DepartmentTeamsPage() {
    const { t } = useTranslation()
    const { departmentId } = useParams()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

    // Initialize from cache if available
    const cached = deptTeamsCache[departmentId]
    const [departmentData, setDepartmentData] = useState(cached?.department || null)
    const [teams, setTeams] = useState(cached?.teams || [])
    const [loading, setLoading] = useState(!cached)
    const isFetching = useRef(false)

    const { lookups, refreshLookups } = useLookups()
    const toast = useRef(null)

    // Mobile edit dialog state
    const [editDialog, setEditDialog] = useState(false)
    const [editData, setEditData] = useState(null)
    const [editErrors, setEditErrors] = useState({})

    // Get active statuses from lookups
    const statusOptions = lookups.activeStatuses.map(s => ({
        label: s.active_status_name,
        value: s.active_status_id
    }))

    // Fetch department and its teams
    const fetchData = React.useCallback(async (force = false) => {
        // Use cache if available and not forced
        if (!force && deptTeamsCache[departmentId]) {
            setDepartmentData(deptTeamsCache[departmentId].department)
            setTeams(deptTeamsCache[departmentId].teams)
            setLoading(false)
            return
        }

        if (isFetching.current) return
        isFetching.current = true
        setLoading(true)
        try {
            const response = await api.get(`/departments/${departmentId}/teams`)
            const department = response.data.department
            const fetchedTeams = response.data.teams || []
            // Update cache
            deptTeamsCache[departmentId] = { department, teams: fetchedTeams }
            setDepartmentData(department)
            setTeams(fetchedTeams)
        } catch (err) {
            console.error('Failed to fetch department teams:', err)
        } finally {
            isFetching.current = false
            setLoading(false)
        }
    }, [departmentId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const { globalFilterValue, filters, onGlobalFilterChange } = useDataTableFilter()

    const renderStatus = (rowData) => {
        const status = lookups.activeStatuses.find(s => s.active_status_id === rowData.active_status_id)
        return <StatusTab status={status?.active_status_name || 'Unknown'} />
    }

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

    const onRowEditComplete = async (e) => {
        const { newData } = e
        const { isValid, errors: validationErrors } = validateForm(newData, validationSchemas.addTeam)
        if (!isValid) {
            const messages = Object.values(validationErrors).map(key => t(key)).join(', ')
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: messages, life: TOAST_LIFE.ERROR })
            return
        }
        try {
            await api.put(`/teams/${newData.team_id}`, newData)
            await fetchData(true)
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: TOAST_LIFE.SUCCESS })
            await refreshLookups()
        } catch (err) {
            console.error('Failed to update team:', err)
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: err.message || t('teams.updateError', 'Failed to update team'), life: TOAST_LIFE.ERROR })
            try {
                await fetchData(true)
            } catch (fetchErr) {
                console.error('Failed to revert team changes:', fetchErr)
            }
        }
    }

    const handleDeleteTeam = (rowData) => {
        confirmDialog({
            message: t('teams.deleteConfirmMessage', { name: rowData.team_name }),
            header: t('teams.deleteConfirmTitle'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.delete(`/teams/${rowData.team_id}`)
                    await fetchData(true)
                    showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('teams.deleteSuccess'), life: TOAST_LIFE.SUCCESS })
                    await refreshLookups()
                } catch (err) {
                    showToast(toast, { severity: 'error', summary: t('common.error'), detail: err.message, life: TOAST_LIFE.ERROR })
                }
            },
        })
    }

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        const { isValid, errors: validationErrors } = validateForm(editData, validationSchemas.addTeam)
        if (!isValid) {
            setEditErrors(validationErrors)
            return
        }
        setEditErrors({})
        try {
            await api.put(`/teams/${editData.team_id}`, editData)
            await fetchData(true)
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: TOAST_LIFE.SUCCESS })
            await refreshLookups()
        } catch (err) {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: err.message || t('teams.updateError', 'Failed to update team'), life: TOAST_LIFE.ERROR })
        }
        setEditDialog(false)
        setEditData(null)
    }

    // Render the search bar with back button
    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center flex-wrap gap-2">
                <Button
                    icon="pi pi-reply"
                    rounded
                    text
                    severity="secondary"
                    tooltip={t('common.goBack')}
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => navigate('/admin/departments')}
                />
                <DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />
            </div>
        )
    }

    // Filter teams for mobile search
    const filteredTeams = teams?.filter(team => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            team.team_abbreviation?.toLowerCase().includes(q) ||
            team.team_name?.toLowerCase().includes(q)
        )
    }) || []

    const breadcrumbItems = [
        { label: t('common.home'), path: '/admin' },
        { label: t('departments.title'), path: '/admin/departments' },
        { label: t('teams.title'), path: null },
    ]

    // Mobile card view
    const mobileCardView = (
        <div className="admin-mobile-container">
            <div className="admin-mobile-search">
                <div className="flex items-center gap-2 w-full">
                    <Button
                        icon="pi pi-reply"
                        rounded
                        text
                        severity="secondary"
                        onClick={() => navigate('/admin/departments')}
                    />
                    <div className="flex-1">
                        <DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />
                    </div>
                </div>
            </div>

            <div className="mb-2 px-1">
                <h3 className="text-base font-semibold text-gray-700">
                    {departmentData?.department_name || t('common.loading')}
                </h3>
            </div>

            <div className="admin-mobile-list">
                {filteredTeams.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredTeams.map(team => {
                        const status = lookups.activeStatuses.find(s => s.active_status_id === team.active_status_id)
                        const statusName = status?.active_status_name || 'Unknown'
                        return (
                            <div key={team.team_id} className="admin-card">
                                <div className="admin-card-header">
                                    <div>
                                        <div className="admin-card-title">{team.team_name}</div>
                                        <div className="admin-card-subtitle">{team.team_abbreviation}</div>
                                    </div>
                                    <StatusTab status={statusName} />
                                </div>
                                <div className="admin-card-actions">
                                    <Button
                                        icon="pi pi-pencil"
                                        size="small"
                                        text
                                        onClick={() => {
                                            setEditData({ ...team })
                                            setEditDialog(true)
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        size="small"
                                        text
                                        severity="danger"
                                        onClick={() => handleDeleteTeam(team)}
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
            <div className="mb-4 pb-2 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700">
                    {departmentData?.department_name || t('common.loading')}
                </h3>
            </div>
            <DataTable
                value={teams}
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25, 50]}
                paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate="{first} to {last} of {totalRecords}"
                editMode="row"
                dataKey="team_id"
                onRowEditComplete={onRowEditComplete}
                filters={filters}
                globalFilterFields={['team_abbreviation', 'team_name', 'active_status_id']}
                header={renderHeader()}
                emptyMessage={t('common.noResults')}
                sortMode="multiple"
                removableSort
                loading={loading}
                scrollable
                tableStyle={{ minWidth: '40rem' }}
            >
                <Column field="team_abbreviation" header={t('teams.code')} sortable editor={textInputEditor}></Column>
                <Column field="team_name" header={t('teams.name')} sortable editor={textInputEditor}></Column>
                <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable editor={statusEditor}></Column>
                <Column rowEditor={true} header={t('common.edit')} headerStyle={{ width: '4rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
                <Column header={t('common.delete')} body={(rowData) => (
                    <Button icon="pi pi-trash" rounded text severity="danger" tooltip={t('common.delete')} tooltipOptions={{ position: 'top' }} onClick={() => handleDeleteTeam(rowData)} />
                )} headerStyle={{ width: '4rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
            </DataTable>
        </div>
    )

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <ContentHeader
                title={t('teams.title')}
                homePath="/admin"
                iconKey="sidebar.teams"
                breadcrumbItems={breadcrumbItems}
            />

            <AddNewTeam toastRef={toast} departmentId={departmentId} onCreated={() => fetchData(true)} />

            {/* Teams list */}
            {isMobile ? mobileCardView : desktopTableView}

            {/* Mobile Edit Dialog */}
            <Dialog
                header={t('teams.editTeam', 'Edit Team')}
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
                        <Input name="team_abbreviation" label={t('teams.code')} value={editData.team_abbreviation || ''} errors={editErrors}
                            onChange={(e) => { setEditData({ ...editData, team_abbreviation: e.target.value }); setEditErrors(prev => ({ ...prev, team_abbreviation: undefined })) }} />
                        <Input name="team_name" label={t('teams.name')} value={editData.team_name || ''} errors={editErrors}
                            onChange={(e) => { setEditData({ ...editData, team_name: e.target.value }); setEditErrors(prev => ({ ...prev, team_name: undefined })) }} />
                        <Select name="active_status_id" label={t('common.status')} value={editData.active_status_id} options={statusOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => { setEditData({ ...editData, active_status_id: e.value }); setEditErrors(prev => ({ ...prev, active_status_id: undefined })) }} />
                    </div>
                )}
            </Dialog>
        </>
    )
}

export default DepartmentTeamsPage
