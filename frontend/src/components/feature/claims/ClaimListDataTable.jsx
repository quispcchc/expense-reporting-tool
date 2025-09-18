import React, { useState } from 'react'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import AmountRangeFilter from '../../common/ui/AmountRangeFilter.jsx'
import DateRangeFilter from '../../common/ui/DateRangeFilter.jsx'
import { FilterMatchMode } from 'primereact/api'
import StatusTab from '../../common/ui/StatusTab.jsx'
import { Link } from 'react-router-dom'
import { Dropdown } from 'primereact/dropdown'
import { claimStatus, claimTypesFilter } from '../../../utils/mockData.js'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { Button } from 'primereact/button'
import { BUTTON_STYLE } from '../../../utils/customizeStyle.js'
import { exportToCSVManual } from '../../../utils/helpers.js'

function ClaimListDataTable ({ claims, user }) {
    // State for global filter input and DataTable filters
    const [globalFilterValue, setGlobalFilterValue] = useState('')

    const [selectedClaims, setSelectedClaims] = useState(null)

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        claimId: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        claimType: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        totalAmount: { value: null, matchMode: FilterMatchMode.BETWEEN },
        createdAt: { value: null, matchMode: FilterMatchMode.BETWEEN },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
    })

    // Handle global search input changes
    const onGlobalFilterChange = (e) => {
        const value = e.target.value
        let _filters = { ...filters }

        _filters[ 'global' ].value = value

        setFilters(_filters)
        setGlobalFilterValue(value)
    }

    const statusBodyTemplate = (rowData) => (
        <StatusTab status={ rowData.status }/>
    )

    const totalAmountBodyTemplate = (rowData) => (
        <>${ rowData.totalAmount.toFixed(2) }</>
    )

    const actionBodyTemplate = (rowData) => (
        <>
            {user === "admin" ?
                <Link to={ `${ rowData.claimId }/edit-claim` }>
                    <button className="pi pi-pencil cursor-pointer"></button>
                </Link> :  <Link to={ `${ rowData.claimId }/view-claim` }>
                    <button className="pi pi-eye cursor-pointer"></button>
                </Link> }

        </>
    )

    const statusItemTemplate = (option) => {
        return <StatusTab status={ option.value }/>
    }

    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown value={ options.value } options={ claimStatus }
                      onChange={ (e) => options.filterApplyCallback(e.value) } itemTemplate={ statusItemTemplate }
                      placeholder="Select" className="p-column-filter min-w-5" showClear/>
        )
    }

    const claimTypeFilterTemplate = (options) => (
        <Dropdown value={ options.value } options={ claimTypesFilter }
                  onChange={ (e) => options.filterApplyCallback(e.value) }
                  placeholder="Select One" className="p-column-filter"/>
    )

    const customTextFilter = (options) => {
        return (
            <InputText
                value={ options.value || '' }
                onChange={ (e) => options.filterApplyCallback(e.target.value) }
                placeholder="Search"
                className="p-column-filter min-w-30"
            />
        )
    }

    const adminHeaderTemplate = () => (
        <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex justify-end">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search"/>
                    <InputText
                        value={ globalFilterValue }
                        onChange={ onGlobalFilterChange }
                        placeholder="Keyword Search"
                    />
                </IconField>
            </div>

            <div className="flex gap-2 flex-wrap">
                <Button label="Approve" outlined className={ BUTTON_STYLE.success } icon="pi pi-check" iconPos="right"/>
                <Button label="Reject" outlined className={ BUTTON_STYLE.danger } icon="pi pi-times" iconPos="right"/>
                <Button label="Export" outlined icon="pi pi-file-export" iconPos="right"
                        onClick={ () => exportToCSVManual(selectedClaims) }/>
                <Link to="/admin/claims/create-claim">
                    <Button label="New Claim" icon="pi pi-plus" iconPos="right"/>
                </Link>

            </div>

        </div>
    )

    const userHeaderTemplate = () => (
        <div className="flex justify-between items-center">
            <div className="flex justify-end">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search"/>
                    <InputText
                        value={ globalFilterValue }
                        onChange={ onGlobalFilterChange }
                        placeholder="Keyword Search"
                    />
                </IconField>
            </div>

            <div className="flex gap-2">
                <Link to="/user/claims/create-claim">
                    <Button label="New Claim" icon="pi pi-plus" iconPos="right"/>
                </Link>
            </div>

        </div>
    )

    return (
        <ComponentContainer>
            <DataTable value={ claims } header={ user === 'admin' ? adminHeaderTemplate : userHeaderTemplate }
                       paginator rows={ 5 } rowsPerPageOptions={ [5, 10, 25, 50] }
                       paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                       currentPageReportTemplate="{first} to {last} of {totalRecords}"
                       filters={ filters } filterDisplay="row"
                       globalFilterFields={ ['claimId', 'claimType', 'totalAmount', 'createdAt', 'status'] }
                       selectionMode="checkbox"
                       selection={ selectedClaims } onSelectionChange={ (e) => setSelectedClaims(e.value) }
            >

                <Column selectionMode="multiple" headerStyle={ { width: '3rem', textAlign: 'center' } }></Column>

                <Column field="claimId" header="Request #" filter filterElement={ customTextFilter }
                        showFilterMenu={ false }></Column>

                <Column field="claimType" header="Claim type" filter filterElement={ claimTypeFilterTemplate }
                        showFilterMenu={ false }></Column>

                <Column field="totalAmount" header="Total Amount" body={ totalAmountBodyTemplate } filter
                        filterElement={ (options) => <AmountRangeFilter options={ options }/> }
                        showFilterMenu={ false }></Column>

                <Column field="createdAt" header="Submitted At" filter
                        filterElement={ (options) => <DateRangeFilter options={ options }/> }
                        showFilterMenu={ false }></Column>

                <Column field="status" header="Status" body={ statusBodyTemplate } filter showFilterMenu={ false }
                        filterElement={ statusRowFilterTemplate }></Column>

                <Column header="Action" body={ actionBodyTemplate }></Column>

            </DataTable>
        </ComponentContainer>
    )
}

export default ClaimListDataTable