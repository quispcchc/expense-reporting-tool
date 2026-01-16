import React, { useState } from 'react'
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

function TeamsPage() {
    const { t } = useTranslation()
    // Access global team state and actions from context
    const { state: { teams, loading, error }, actions: { updateTeam } } = useTeam()
    const { lookups, refreshLookups } = useLookups()

    // Get active statuses from lookups (maps to status names)
    const statusOptions = lookups.activeStatuses.map(s => s.name || s)

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
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={statusOptions}
        />
    )

    // Handle row edit completion: update team via context action
    const onRowEditComplete = async (e) => {
        const { newData } = e
        await updateTeam(newData)
        await refreshLookups()
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
            <ContentHeader title={t('teams.title')} homePath="/admin" iconKey="sidebar.teams" />
            {/* Add new team form component */}
            <AddNewTeam />
            <div className="bg-white rounded-xl p-6 mt-5">
                {/* DataTable for listing and editing teams */}
                <DataTable
                    value={teams}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="{first} to {last} of {totalRecords}"
                    editMode="row"
                    onRowEditComplete={onRowEditComplete}
                    filters={filters}
                    globalFilterFields={['team_abbreviation', 'team_name', 'active_status_id']}
                    header={renderHeader()}
                    emptyMessage={t('common.noResults')}
                    sortMode="multiple"
                    removableSort
                >
                    {/* Columns with inline editing */}
                    <Column field="team_abbreviation" header={t('teams.code')} sortable editor={textInputEditor}></Column>
                    <Column field="team_name" header={t('teams.name')} sortable editor={textInputEditor}></Column>
                    <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable editor={statusEditor}></Column>
                    <Column rowEditor={true} header={t('common.actions')} />
                </DataTable>
            </div>
        </>
    )
}

export default TeamsPage
