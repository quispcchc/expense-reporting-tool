import React, { useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewTeam from '../../components/feature/team/AddNewTeam.jsx'
import { DataTable } from 'primereact/datatable'
import { useTeam } from '../../contexts/TeamContext.jsx'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import { Toast } from 'primereact/toast'
import { Button } from 'primereact/button'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import { useDataTableFilter } from '../../hooks/useDataTableFilter.js'
import { useMobileEditDialog } from '../../hooks/useMobileEditDialog.js'
import { textInputEditor } from '../../utils/dataTableEditors.jsx'
import DataTableSearchHeader from '../../components/common/ui/DataTableSearchHeader.jsx'
import MobileEditDialog from '../../components/common/ui/MobileEditDialog.jsx'
import { showToast, TOAST_LIFE } from '../../utils/helpers.js'
import { validateForm } from '../../utils/validation/validator.js'
import { validationSchemas } from '../../utils/validation/schemas.js'
import Input from '../../components/common/ui/Input.jsx'
import Select from '../../components/common/ui/Select.jsx'

function TeamsPage() {
    const { t } = useTranslation()
    const toast = useRef(null)
    const isMobile = useIsMobile()

    // Access global team state and actions from context
    const { state: { teams }, actions: { updateTeam, refreshTeams } } = useTeam()
    const { lookups, refreshLookups } = useLookups()

    // Get active statuses from lookups
    const statusOptions = lookups.activeStatuses.map(s => ({ label: s.active_status_name, value: s.active_status_id }))

    const { globalFilterValue, filters, onGlobalFilterChange } = useDataTableFilter()
    const { editDialog, editData, editErrors, openDialog, closeDialog, updateField, validate } = useMobileEditDialog({ validationSchema: validationSchemas.addTeam })

    // Custom renderer to display the status badge/tab
    const renderStatus = (rowData) => {
        const status = lookups.activeStatuses.find(s => s.active_status_id === rowData.active_status_id)
        return <StatusTab status={status?.active_status_name || 'Unknown'} />
    }

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
        const { isValid, errors: validationErrors } = validateForm(newData, validationSchemas.addTeam)
        if (!isValid) {
            const messages = Object.values(validationErrors).map(key => t(key)).join(', ')
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: messages, life: TOAST_LIFE.ERROR })
            return
        }
        const result = await updateTeam(newData)

        if (result.success) {
            refreshTeams()
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: TOAST_LIFE.SUCCESS })
            await refreshLookups()
        } else {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: result.error || t('teams.updateError', 'Failed to update team'), life: TOAST_LIFE.ERROR })
        }
    }

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        const { isValid } = validate()
        if (!isValid) return
        const result = await updateTeam(editData)
        if (result.success) {
            refreshTeams()
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: TOAST_LIFE.SUCCESS })
            await refreshLookups()
        } else {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: result.error || t('teams.updateError', 'Failed to update team'), life: TOAST_LIFE.ERROR })
        }
        closeDialog()
    }

    const renderHeader = () => (
        <DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />
    )

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
                <DataTableSearchHeader value={globalFilterValue} onChange={onGlobalFilterChange} />
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
                                        onClick={() => openDialog(team)}
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
            <MobileEditDialog visible={editDialog} header={t('teams.editTeam', 'Edit Team')} onHide={closeDialog} onSave={handleMobileEditSave}>
                {editData && (
                    <div className="flex flex-col gap-4">
                        <Input name="team_abbreviation" label={t('teams.code')} value={editData.team_abbreviation || ''} errors={editErrors}
                            onChange={(e) => updateField('team_abbreviation', e.target.value)} />
                        <Input name="team_name" label={t('teams.name')} value={editData.team_name || ''} errors={editErrors}
                            onChange={(e) => updateField('team_name', e.target.value)} />
                        <Select name="active_status_id" label={t('common.status')} value={editData.active_status_id} options={statusOptions} optionValue="value" errors={editErrors}
                            onChange={(e) => updateField('active_status_id', e.value)} />
                    </div>
                )}
            </MobileEditDialog>
        </>
    )
}

export default TeamsPage
