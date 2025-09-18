import React, { useEffect, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import AddNewCostCentre from '../../components/feature/costCentre/AddNewCostCentre.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { useCostCentre, useCostCentreDispatch } from '../../contexts/CostCentreContext.jsx'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { mockTeams, status } from '../../utils/mockData.js'
import { FilterMatchMode } from 'primereact/api'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'

function CostCentresPage () {
    const costCentreState = useCostCentre()
    const dispatch = useCostCentreDispatch()
    const [costCentres, setCostCentres] = useState([])
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

    useEffect(() => {
        setCostCentres(costCentreState)
    }, [costCentreState])

    const renderStatus = (rowData) => (
        <StatusTab status={ rowData.status }/>
    )

    const areaEditor = (editorOptions) => (
        <Dropdown
            value={ editorOptions.value }
            onChange={ (e) => editorOptions.editorCallback(e.target.value) }
            options={ mockTeams.map(option=>({
                label:option.name,
                value:option.name
            })) }
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

    const statusEditor = (editorOptions) => (
        <Dropdown
            value={ editorOptions.value }
            onChange={ (e) => editorOptions.editorCallback(e.target.value) }
            options={ status }
        />
    )


    const onRowEditComplete = (e) => {
        let _costCentres = [...costCentres]
        let { newData, index } = e

        _costCentres[ index ] = newData

        setCostCentres(_costCentres)

        dispatch({ type: 'update', payload: newData })
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
            <ContentHeader title='Cost Centres' homePath='/admin'/>
            <AddNewCostCentre/>
            <div className="bg-white rounded-xl p-6 mt-5">
                <DataTable value={ costCentres } paginator rows={ 5 } rowsPerPageOptions={ [5, 10, 25, 50] }
                           filters={ filters } globalFilterFields={ ['area', 'code', 'status', 'description'] }
                           header={ renderHeader } emptyMessage="No results found."
                           editMode="row" onRowEditComplete={ onRowEditComplete }
                           sortMode="multiple" removableSort>
                    <Column field="area" header="Area" sortable editor={ areaEditor }></Column>
                    <Column field="code" header="Code" sortable editor={ textInputEditor }></Column>
                    <Column field="status" header="Status" body={ renderStatus } sortable editor={ statusEditor }></Column>
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