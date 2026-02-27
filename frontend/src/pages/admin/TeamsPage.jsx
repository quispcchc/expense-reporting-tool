import React, { useState, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewTeam from '../../components/feature/team/AddNewTeam.jsx'
import { DataTable } from 'primereact/datatable'
import { useTeam } from '../../contexts/TeamContext.jsx'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { InputText } from 'primereact/inputtext'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { useTranslation } from 'react-i18next'
import { Toast } from 'primereact/toast'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { useIsMobile } from '../../hooks/useIsMobile.js'

function TeamsPage() {
    const { t } = useTranslation()
    const toast = useRef(null)
    const isMobile = useIsMobile()

    // Access global team state and actions from context
    const { state: { teams, loading, error }, actions: { updateTeam, refreshTeams } } = useTeam()
    const { lookups, refreshLookups } = useLookups()

    // Get active statuses from lookups
    const statusOptions = lookups.activeStatuses.map(s => ({ label: s.active_status_name, value: s.active_status_id }))

    // State for global filter input and DataTable filters
    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Mobile edit dialog state
    const [editDialog, setEditDialog] = useState(false)
    const [editData, setEditData] = useState(null)

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
        const status = lookups.activeStatuses.find(s => s.active_status_id === rowData.active_status_id)
        return <StatusTab status={status?.active_status_name || 'Unknown'} />
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
        />
    )

    // Handle row edit completion: update team via context action
    const onRowEditComplete = async (e) => {
        const { newData } = e
        const result = await updateTeam(newData)

        if (result.success) {
            refreshTeams() // Force refresh data from server
            toast.current.show({ severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: 3000 })
            await refreshLookups()
        } else {
            toast.current.show({ severity: 'error', summary: t('common.error'), detail: result.error || t('teams.updateError', 'Failed to update team'), life: 5000 })
        }
    }

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        const result = await updateTeam(editData)

        if (result.success) {
            refreshTeams()
            toast.current.show({ severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: 3000 })
            await refreshLookups()
        } else {
            toast.current.show({ severity: 'error', summary: t('common.error'), detail: result.error || t('teams.updateError', 'Failed to update team'), life: 5000 })
        }
        setEditDialog(false)
        setEditData(null)
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

    // Filter teams for mobile search
    const filteredTeams = teams?.filter(team => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            team.team_abbreviation?.toLowerCase().includes(q) ||
            team.team_name?.toLowerCase().includes(q)
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
                {filteredTeams.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredTeams.map(team => {
                        const status = lookups.activeStatuses.find(s => s.active_status_id === team.active_status_id)
                        return (
                            <div key={team.team_id} className="admin-card">
                                <div className="admin-card-header">
                                    <div>
                                        <div className="admin-card-title">{team.team_name}</div>
                                        <div className="admin-card-subtitle">{team.team_abbreviation}</div>
                                    </div>
                                    <StatusTab status={status?.active_status_name || 'Unknown'} />
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
                scrollable
                tableStyle={{ minWidth: '40rem' }}
            >
                <Column field="team_abbreviation" header={t('teams.code')} sortable editor={textInputEditor}></Column>
                <Column field="team_name" header={t('teams.name')} sortable editor={textInputEditor}></Column>
                <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable editor={statusEditor}></Column>
                <Column rowEditor={true} header={t('common.actions')} />
            </DataTable>
        </div>
    )

    return (
        <>
            <Toast ref={toast} />
            {/* Page title and navigation */}
            <ContentHeader title={t('teams.title')} homePath="/admin" iconKey="sidebar.teams" />
            {/* Add new team form component */}
            <AddNewTeam toastRef={toast} />

            {isMobile ? mobileCardView : desktopTableView}

            {/* Mobile Edit Dialog */}
            <Dialog
                header={t('teams.editTeam', 'Edit Team')}
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
                            <label>{t('teams.code')}</label>
                            <InputText
                                value={editData.team_abbreviation || ''}
                                onChange={(e) => setEditData({ ...editData, team_abbreviation: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('teams.name')}</label>
                            <InputText
                                value={editData.team_name || ''}
                                onChange={(e) => setEditData({ ...editData, team_name: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('common.status')}</label>
                            <Dropdown
                                value={editData.active_status_id}
                                onChange={(e) => setEditData({ ...editData, active_status_id: e.value })}
                                options={statusOptions}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                    </>
                )}
            </Dialog>
        </>
    )
}

export default TeamsPage
