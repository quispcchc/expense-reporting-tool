import React, { useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewCostCentre from '../../components/feature/costCentre/AddNewCostCentre.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useCostCentre } from '../../contexts/CostCentreContext.jsx'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { ProgressSpinner } from 'primereact/progressspinner'

function CostCentresPage () {
    const {lookups} = useLookups()
    const { state,actions } = useCostCentre()
    const {costCentres,loading} = state
    const {updateCostCentre} = actions

    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })
    const onGlobalFilterChange = (e) => {
        const value = e.target.value
        let _filters = { ...filters }

        _filters[ 'global' ].value = value

        setFilters(_filters)
        setGlobalFilterValue(value)
    }

    const renderStatus = (rowData) =>(
        <StatusTab status={ rowData.active_status?.active_status_name }/>
    )

    const areaEditor = (editorOptions) => (
        <Dropdown
            value={ editorOptions.value }
            onChange={ (e) => editorOptions.editorCallback(e.value) }
            options={lookups.teams.map(team => ({
                label: team.team_name,
                value: team.team_id
            }))}
        />

    )

    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={ editorOptions.value || '' }
            onChange={ (e) => editorOptions.editorCallback(e.target.value) }
            className="w-full"
        />
    )

    const statusEditor = (editorOptions) => {
        console.log(editorOptions)

        return (
            <Dropdown
                value={ editorOptions.value }
                onChange={ (e) => {
                    console.log(e.value)
                    editorOptions.editorCallback(e.value)} }

                options={ lookups.activeStatuses.map(status => ({
                    label: status.active_status_name,
                    value: status.active_status_id
                })) }
            />
        )
    }


    const onRowEditComplete = (e) => {
        console.log('event',e)
        console.log('new data',e.newData)
        updateCostCentre(e.newData)
    }

    const renderHeader = () => {
        return (
            <div className="flex justify-end">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search"/>
                    <InputText value={ globalFilterValue } onChange={ onGlobalFilterChange }
                               placeholder="Keyword Search"/>
                </IconField>
            </div>
        )
    }

    return (
        <>
            {loading && (
                <div className="absolute inset-0 flex justify-center items-center bg-white/50 z-10">
                    <ProgressSpinner />
                </div>
            )}
            <ContentHeader title='Cost Centres' homePath='/admin'/>
            <AddNewCostCentre/>
            <div className="bg-white rounded-xl p-6 mt-5">
                <DataTable value={ costCentres } paginator rows={ 5 } rowsPerPageOptions={ [5, 10, 25, 50] }
                           filters={ filters } globalFilterFields={ ['team.team_name"', 'cost_centre_code', 'active_status.active_status_name', 'description'] }
                           header={ renderHeader } emptyMessage="No results found."
                           editMode="row" onRowEditComplete={ onRowEditComplete }
                           sortMode="multiple" removableSort>
                    <Column field="team_id" header="Area" sortable editor={ areaEditor }   body={(rowData) => rowData.team?.team_name}></Column>
                    <Column field="cost_centre_code" header="Code" sortable editor={ textInputEditor }></Column>
                    <Column field="active_status_id" header="Status" body={ renderStatus } sortable editor={ statusEditor }></Column>
                    <Column field="description" header="Description" sortable editor={ textInputEditor }></Column>
                    <Column
                        rowEditor={ true }
                        header="Actions"
                    />
                </DataTable>

            </div>
        </>
    )
}

export default CostCentresPage