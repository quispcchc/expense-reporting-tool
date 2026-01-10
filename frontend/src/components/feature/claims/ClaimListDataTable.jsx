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
import { BUTTON_STYLE, STATUS_STYLES } from '../../../utils/customizeStyle.js'
import { exportToCSVManual, showToast } from '../../../utils/helpers.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useClaims } from '../../../contexts/ClaimContext.jsx'
import api from '../../../api/api.js'
import { confirmDialog } from 'primereact/confirmdialog'

function ClaimListDataTable ({ claims ,user,path, toastRef }) {
    const { fetchClaims } = useClaims()

    useEffect(() => {
        const fetchData = async() => {
            await fetchClaims()
        }
        fetchData()
    }, [])

    const { lookups: { claimStatus, claimTypes } } = useLookups()

    // State for global filter input and DataTable filters
    const [globalFilterValue, setGlobalFilterValue] = useState('')

    const [selectedClaims, setSelectedClaims] = useState(null)
    const isDisabled = !selectedClaims || selectedClaims.length === 0;
    const [isExporting, setIsExporting] = useState(false)

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

    // Column Render Template
    const statusBodyTemplate = (rowData) => (
            <StatusTab status={ rowData.claim_status_id }/>
        )

    const totalAmountBodyTemplate = (rowData) => (
        <>${ rowData.total_amount }</>
    )

    const statusItemTemplate = (option) => {
        return <div
            className={ `rounded-lg p-1 text-center text-sm font-medium w-21 ${ STATUS_STYLES[ option.value ] }` }>
            { option.value }
        </div>

    }

    // Filter Template
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

     function bulkApproveClaim () {
        const claimIds = selectedClaims.map(claim => claim.claim_id)
        const payload = {claimIds}

        confirmDialog({
            message: 'Do you want to approve all selected claims?',
            header: 'Bulk Approve Confirmation',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-info',
            accept: async() => {
                try {
                    await api.post('claims/bulk-approve', payload)
                    await fetchClaims()
                    showToast(toastRef, { severity: 'success', summary: 'Success', detail: 'Selected claims has been approved successfully!' })
                }
                catch (error) {
                    showToast(toastRef, { severity: 'error', summary: 'Error', detail: error.message })
                }
            },
            reject: ()=>{ return showToast(toastRef, { severity: 'success', summary: 'Success', detail:'Bulk Approve Cancelled' })},
        })

         setSelectedClaims([])

    }

     function bulkRejectClaim () {
        const claimIds = selectedClaims.map(claim => claim.claim_id)
        const payload = {claimIds}

        confirmDialog({
            message: 'Do you want to reject all selected claims?',
            header: 'Bulk Reject Confirmation',
            icon: 'pi pi-info-circle',
            defaultFocus: 'reject',
            acceptClassName: 'p-button-info',
            accept: async() => {
                try {
                    await api.post('claims/bulk-reject', payload)
                    await fetchClaims()
                    showToast(toastRef, { severity: 'success', summary: 'Success', detail: 'Selected claims has been rejected successfully!' })
                }
                catch (error) {
                    showToast(toastRef, { severity: 'error', summary: 'Error', detail: error.message })
                }
            },
            reject: ()=>{ return showToast(toastRef, { severity: 'info', summary: 'Cancel', detail:'Bulk Reject Cancelled' })},
        })

        setSelectedClaims([])


    }

    async function handleExportPdf() {
        if (!selectedClaims || selectedClaims.length === 0) {
            showToast(toastRef, { 
                severity: 'warn', 
                summary: 'Warning', 
                detail: 'Please select at least one claim to export' 
            })
            return
        }

        setIsExporting(true)

        try {
            // Single claim - direct PDF download
            if (selectedClaims.length === 1) {
                const claimId = selectedClaims[0].claim_id
                const response = await api.get(`/claims/${claimId}/export-pdf`, {
                    responseType: 'blob',
                })

                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `claim_${claimId}_${new Date().toISOString().split('T')[0]}.pdf`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)

                showToast(toastRef, { 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: 'PDF exported successfully' 
                })
            } 
            // Multiple claims - ZIP download
            else {
                const claimIds = selectedClaims.map(claim => claim.claim_id)
                const response = await api.post('/claims/export-multiple-pdf', 
                    { claimIds },
                    { responseType: 'blob' }
                )

                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `claims_export_${new Date().toISOString().split('T')[0]}.zip`)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)

                showToast(toastRef, { 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: `${selectedClaims.length} claims exported as ZIP file` 
                })
            }
        } catch (error) {
            console.error('Error exporting PDF:', error)
            let errorDetail = 'Failed to export PDF. Please try again.';
            
            if (error?.message) {
                errorDetail = error.message;
            } else if (error?.response?.status === 500) {
                errorDetail = 'Server error during PDF generation. Check the server logs for details.';
            } else if (error?.response?.status === 408) {
                errorDetail = 'Request timeout. The PDF generation took too long. Please try again.';
            }
            
            showToast(toastRef, { 
                severity: 'error', 
                summary: 'Error', 
                detail: errorDetail 
            })
        } finally {
            setIsExporting(false)
        }
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
                <Button label="Approve" outlined className={ BUTTON_STYLE.success } icon="pi pi-check" iconPos="right"
                        onClick={ bulkApproveClaim } disabled={isDisabled || isExporting}/>
                <Button label="Reject" outlined className={ BUTTON_STYLE.danger } icon="pi pi-times" iconPos="right"
                        onClick={ bulkRejectClaim } disabled={isDisabled || isExporting}/>
                <Button 
                    label={isExporting ? "Exporting..." : "Export"} 
                    outlined 
                    icon={isExporting ? "pi pi-spin pi-spinner" : "pi pi-file-export"} 
                    iconPos="right"
                    onClick={ handleExportPdf } 
                    disabled={isDisabled || isExporting}
                    loading={isExporting}
                />
                <Link to={`${path}/claims/create-claim`}>
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
                <Link to={`${path}/claims/create-claim`}>
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
                           'status.claim_status_name',
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