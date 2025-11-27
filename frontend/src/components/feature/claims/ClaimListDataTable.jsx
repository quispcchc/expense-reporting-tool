import React, { useEffect, useState } from 'react'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import AmountRangeFilter from '../../common/ui/AmountRangeFilter.jsx'
import DateRangeFilter from '../../common/ui/DateRangeFilter.jsx'
import { FilterMatchMode } from 'primereact/api'
import StatusTab from '../../common/ui/StatusTab.jsx'
import { Link } from 'react-router-dom'
import { Dropdown } from 'primereact/dropdown'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { Button } from 'primereact/button'
import { BUTTON_STYLE } from '../../../utils/customizeStyle.js'
import { exportToCSVManual } from '../../../utils/helpers.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useClaims } from '../../../contexts/ClaimContext.jsx'

function ClaimListDataTable ({ claims, user }) {
    const {fetchClaims}=useClaims()

    useEffect(() => {
        const fetchData = async () => {
            await fetchClaims();
        };
        fetchData();
    }, []);

    const { lookups: { claimStatus, claimTypes } } = useLookups()

    // State for global filter input and DataTable filters
    const [globalFilterValue, setGlobalFilterValue] = useState('')

    const [selectedClaims, setSelectedClaims] = useState(null)

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        claim_id: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        'claim_type.claim_type_name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        total_amount: { value: null, matchMode: FilterMatchMode.BETWEEN },
        claim_submitted: { value: null, matchMode: FilterMatchMode.BETWEEN },
        'status.claim_status_name': { value: null, matchMode: FilterMatchMode.EQUALS },
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
        <StatusTab status={ rowData.status.claim_status_name }/>
    )

    const totalAmountBodyTemplate = (rowData) => (
        <>${ rowData.total_amount }</>
    )

    const actionBodyTemplate = (rowData) => (
        <>
            { user === 'admin' ?
                <Link to={ `${ rowData.claim_id }/edit-claim` }>
                    <button className="pi pi-pencil cursor-pointer"></button>
                </Link> : <Link to={ `${ rowData.claim_id }/view-claim` }>
                    <button className="pi pi-eye cursor-pointer"></button>
                </Link> }

        </>
    )

    const statusItemTemplate = (option) => {
        return <StatusTab status={ option.value }/>
    }

    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown value={ options.value } options={ claimStatus.map(
                opt => ( { label: opt.claim_status_name, value: opt.claim_status_name } )) }
                      onChange={ (e) => options.filterApplyCallback(e.value) } itemTemplate={ statusItemTemplate }
                      placeholder="Select" className="p-column-filter min-w-5" showClear/>
        )
    }

    const claimTypeFilterTemplate = (options) => (
        <Dropdown value={ options.value }
                  options={ claimTypes.map(opt => ( { label: opt.claim_type_name, value: opt.claim_type_name } )) }
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
                       globalFilterFields={ [
                           'claim_id',
                           'claim_type.claim_type_name',
                           'total_amount',
                           'claim_submitted',
                           'status.claim_status_name'
                       ] }
                       selectionMode="checkbox"
                       selection={ selectedClaims } onSelectionChange={ (e) => setSelectedClaims(e.value) }
            >

                <Column selectionMode="multiple" headerStyle={ { width: '3rem', textAlign: 'center' } }></Column>

                <Column field="claim_id" header="Request #" sortable filter filterElement={ customTextFilter }
                        showFilterMenu={ false }></Column>

                <Column field="claim_type.claim_type_name" header="Claim type" filter sortable
                        filterElement={ claimTypeFilterTemplate }
                        showFilterMenu={ false }></Column>

                <Column field="total_amount" header="Total Amount" body={ totalAmountBodyTemplate } sortable filter
                        filterElement={ (options) => <AmountRangeFilter options={ options }/> }
                        showFilterMenu={ false }></Column>

                <Column field="claim_submitted" header="Submitted At" sortable
                        filter filterElement={ (options) => <DateRangeFilter options={ options }/> }
                        showFilterMenu={ false }></Column>

                <Column field="status.claim_status_name" header="Status" body={ statusBodyTemplate } sortable filter
                        showFilterMenu={ false }
                        filterElement={ statusRowFilterTemplate }></Column>

                <Column header="Action" body={ actionBodyTemplate }></Column>

            </DataTable>
        </ComponentContainer>
    )
}

export default ClaimListDataTable