import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { showToast } from '../../utils/helpers.js'
import api from '../../api/api.js'

const INITIAL_FILTERS = {
    date_from: '',
    date_to: '',
    claim_type_id: null,
    claim_status_id: null,
    department_id: null,
    team_id: null,
    project_id: null,
    cost_centre_id: null,
    submitter: '',
    tag_ids: null,
    amount_min: null,
    amount_max: null,
}

function DashboardPage() {
    const { t } = useTranslation()
    const { lookups } = useLookups()
    const toast = useRef(null)

    const [filters, setFilters] = useState({ ...INITIAL_FILTERS })
    const [exporting, setExporting] = useState(false)
    const [searching, setSearching] = useState(false)
    const [previewData, setPreviewData] = useState(null) // null = not searched yet

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({ ...INITIAL_FILTERS })
        setPreviewData(null)
    }

    /**
     * Build query params from current filter state.
     */
    const buildParams = () => {
        const params = {}

        if (filters.date_from) params.date_from = filters.date_from
        if (filters.date_to) params.date_to = filters.date_to

        const directKeys = [
            'claim_type_id', 'claim_status_id', 'department_id',
            'team_id', 'project_id', 'cost_centre_id',
            'amount_min', 'amount_max',
        ]
        directKeys.forEach(key => {
            if (filters[key] != null) params[key] = filters[key]
        })

        if (filters.submitter?.trim()) {
            params.submitter = filters.submitter.trim()
        }

        if (filters.tag_ids?.length) {
            params.tag_ids = filters.tag_ids.join(',')
        }

        return params
    }

    /**
     * Fetch filtered claims for preview table.
     */
    const handleSearch = async () => {
        setSearching(true)
        try {
            const params = buildParams()
            const response = await api.get('claims/export-csv', {
                params,
                responseType: 'blob',
            })

            // Parse CSV blob into rows for preview
            const text = await response.data.text()
            const lines = text.split('\n').filter(line => line.trim())

            if (lines.length <= 1) {
                setPreviewData([])
                showToast(toast, {
                    severity: 'warn',
                    summary: t('dashboard.export.noData', 'No Data'),
                    detail: t('dashboard.export.noDataDetail', 'No records match the current filters.'),
                })
                return
            }

            // Parse CSV header + rows
            const parseCSVLine = (line) => {
                const result = []
                let current = ''
                let inQuotes = false
                for (let i = 0; i < line.length; i++) {
                    const ch = line[i]
                    if (ch === '"') {
                        if (inQuotes && line[i + 1] === '"') {
                            current += '"'
                            i++
                        } else {
                            inQuotes = !inQuotes
                        }
                    } else if (ch === ',' && !inQuotes) {
                        result.push(current)
                        current = ''
                    } else {
                        current += ch
                    }
                }
                result.push(current)
                return result
            }

            // Remove BOM from first line if present
            let headerLine = lines[0]
            if (headerLine.charCodeAt(0) === 0xFEFF) {
                headerLine = headerLine.substring(1)
            }

            const headers = parseCSVLine(headerLine)
            const rows = lines.slice(1).map((line, idx) => {
                const values = parseCSVLine(line)
                const row = { _rowIndex: idx }
                headers.forEach((h, i) => {
                    row[h] = values[i] || ''
                })
                return row
            })

            setPreviewData(rows)

            showToast(toast, {
                severity: 'success',
                summary: t('dashboard.search.found', 'Results Found'),
                detail: t('dashboard.search.foundDetail', '{{count}} record(s) found.', { count: rows.length }),
            })
        } catch (error) {
            console.error('Search failed:', error)
            setPreviewData([])
            showToast(toast, {
                severity: 'error',
                summary: t('dashboard.search.error', 'Search Failed'),
                detail: error.message || t('dashboard.search.errorDetail', 'An error occurred while searching.'),
            })
        } finally {
            setSearching(false)
        }
    }

    /**
     * Download CSV file.
     */
    const handleExport = async () => {
        setExporting(true)
        try {
            const params = buildParams()
            const response = await api.get('claims/export-csv', {
                params,
                responseType: 'blob',
            })

            if (response.data.size === 0) {
                showToast(toast, {
                    severity: 'warn',
                    summary: t('dashboard.export.noData', 'No Data'),
                    detail: t('dashboard.export.noDataDetail', 'No records match the current filters.'),
                })
                return
            }

            const disposition = response.headers['content-disposition']
            let filename = `claims_export_${Date.now()}.csv`
            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/)
                if (match) filename = match[1]
            }

            const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)

            showToast(toast, {
                severity: 'success',
                summary: t('dashboard.export.success', 'Export Complete'),
                detail: t('dashboard.export.successDetail', 'CSV file has been downloaded.'),
            })
        } catch (error) {
            console.error('CSV Export failed:', error)
            showToast(toast, {
                severity: 'error',
                summary: t('dashboard.export.error', 'Export Failed'),
                detail: error.message || t('dashboard.export.errorDetail', 'An error occurred during export.'),
            })
        } finally {
            setExporting(false)
        }
    }

    // Dropdown options
    const claimTypeOptions = lookups.claimTypes.map(ct => ({
        label: ct.claim_type_name, value: ct.claim_type_id,
    }))
    const claimStatusOptions = lookups.claimStatus.map(cs => ({
        label: cs.claim_status_name, value: cs.claim_status_id,
    }))
    const departmentOptions = lookups.departments.map(d => ({
        label: d.department_name, value: d.department_id,
    }))
    // Filter teams based on selected department
    const teamOptions = filters.department_id
        ? lookups.teams
            .filter(tm => tm.department_id === filters.department_id)
            .map(tm => ({
        label: tm.team_name, value: tm.team_id,
    }))
        : []
    const projectOptions = lookups.projects.map(p => ({
        label: p.project_name, value: p.project_id,
    }))
    const costCentreOptions = lookups.costCentres.map(cc => ({
        label: `${cc.cost_centre_code} - ${cc.cost_centre_name ?? ''}`.trim(),
        value: cc.cost_centre_id,
    }))
    const tagOptions = lookups.tags.map(tg => ({
        label: tg.tag_name, value: tg.tag_id,
    }))

    // Status body template for table
    const statusBodyTemplate = (rowData) => {
        const statusName = rowData['Claim Status']
        if (!statusName) return null
        return <StatusTab status={statusName} />
    }

    // Amount body template
    const amountBodyTemplate = (rowData) => {
        const amount = rowData['Total Claim Amount']
        if (!amount) return null
        return <>${parseFloat(amount).toFixed(2)}</>
    }

    return (
        <>
            <Toast ref={toast} />

            <ContentHeader
                title={t('dashboard.title', 'Dashboard')}
                homePath="/admin"
                iconKey="sidebar.dashboard"
            />

            {/* Filter Panel */}
            <div className="bg-white rounded-xl p-4 md:p-6 mt-5">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <i className="pi pi-filter" />
                    {t('dashboard.filters.title', 'Export Filters')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Date From */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.dateFrom', 'Date From')}
                        </label>
                        <input
                            type="date"
                            id="dateFrom"
                            value={filters.date_from}
                            onChange={e => updateFilter('date_from', e.target.value)}
                            className="p-inputtext p-component w-full"
                        />
                    </div>

                    {/* Date To */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.dateTo', 'Date To')}
                        </label>
                        <input
                            type="date"
                            id="dateTo"
                            value={filters.date_to}
                            onChange={e => updateFilter('date_to', e.target.value)}
                            className="p-inputtext p-component w-full"
                        />
                    </div>

                    {/* Claim Type */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.claimType', 'Claim Type')}
                        </label>
                        <Dropdown
                            id="claimType"
                            value={filters.claim_type_id}
                            options={claimTypeOptions}
                            onChange={e => updateFilter('claim_type_id', e.value)}
                            placeholder={t('dashboard.filters.selectAll', 'All')}
                            showClear
                            className="w-full"
                        />
                    </div>

                    {/* Claim Status */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.claimStatus', 'Claim Status')}
                        </label>
                        <Dropdown
                            id="claimStatus"
                            value={filters.claim_status_id}
                            options={claimStatusOptions}
                            onChange={e => updateFilter('claim_status_id', e.value)}
                            placeholder={t('dashboard.filters.selectAll', 'All')}
                            showClear
                            className="w-full"
                        />
                    </div>

                    {/* Department */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.department', 'Department')}
                        </label>
                        <Dropdown
                            id="department"
                            value={filters.department_id}
                            options={departmentOptions}
                            onChange={e => {
                                updateFilter('department_id', e.value)
                                // Clear team selection when department changes
                                if (filters.team_id) {
                                    updateFilter('team_id', null)
                                }
                            }}
                            placeholder={t('dashboard.filters.selectAll', 'All')}
                            showClear
                            className="w-full"
                        />
                    </div>

                    {/* Team */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.team', 'Team')}
                        </label>
                        <Dropdown
                            id="team"
                            value={filters.team_id}
                            options={teamOptions}
                            onChange={e => updateFilter('team_id', e.value)}
                            placeholder={
                                filters.department_id
                                    ? t('dashboard.filters.selectAll', 'All')
                                    : t('dashboard.filters.selectDepartmentFirst', 'Select department first')
                            }
                            showClear
                            disabled={!filters.department_id}
                            className="w-full"
                        />
                    </div>

                    {/* Project */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.project', 'Project')}
                        </label>
                        <Dropdown
                            id="project"
                            value={filters.project_id}
                            options={projectOptions}
                            onChange={e => updateFilter('project_id', e.value)}
                            placeholder={t('dashboard.filters.selectAll', 'All')}
                            showClear
                            className="w-full"
                        />
                    </div>

                    {/* Cost Centre */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.costCentre', 'Cost Centre')}
                        </label>
                        <Dropdown
                            id="costCentre"
                            value={filters.cost_centre_id}
                            options={costCentreOptions}
                            onChange={e => updateFilter('cost_centre_id', e.value)}
                            placeholder={t('dashboard.filters.selectAll', 'All')}
                            showClear
                            className="w-full"
                        />
                    </div>

                    {/* Submitter */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.submitter', 'Submitter')}
                        </label>
                        <InputText
                            id="submitter"
                            value={filters.submitter}
                            onChange={e => updateFilter('submitter', e.target.value)}
                            placeholder={t('dashboard.filters.searchByName', 'Search by name')}
                            className="w-full"
                        />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.tags', 'Tags')}
                        </label>
                        <MultiSelect
                            id="tags"
                            value={filters.tag_ids}
                            options={tagOptions}
                            onChange={e => updateFilter('tag_ids', e.value)}
                            placeholder={t('dashboard.filters.selectTags', 'Select tags')}
                            display="chip"
                            className="w-full"
                        />
                    </div>

                    {/* Min Amount */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.minAmount', 'Min Amount')}
                        </label>
                        <InputNumber
                            id="amountMin"
                            value={filters.amount_min}
                            onValueChange={e => updateFilter('amount_min', e.value)}
                            mode="currency"
                            currency="CAD"
                            locale="en-CA"
                            placeholder="$0.00"
                            className="w-full"
                        />
                    </div>

                    {/* Max Amount */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.maxAmount', 'Max Amount')}
                        </label>
                        <InputNumber
                            id="amountMax"
                            value={filters.amount_max}
                            onValueChange={e => updateFilter('amount_max', e.value)}
                            mode="currency"
                            currency="CAD"
                            locale="en-CA"
                            placeholder="$0.00"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
                    <Button
                        id="clearFiltersBtn"
                        label={t('dashboard.filters.clearFilters', 'Clear Filters')}
                        icon="pi pi-filter-slash"
                        severity="secondary"
                        outlined
                        onClick={clearFilters}
                    />
                    <Button
                        id="searchBtn"
                        label={searching
                            ? t('dashboard.search.searching', 'Searching...')
                            : t('dashboard.search.button', 'Search')}
                        icon={searching ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
                        severity="info"
                        onClick={handleSearch}
                        disabled={searching || exporting}
                    />
                    <Button
                        id="exportCsvBtn"
                        label={exporting
                            ? t('dashboard.export.exporting', 'Exporting...')
                            : t('dashboard.export.button', 'Export to CSV')}
                        icon={exporting ? 'pi pi-spin pi-spinner' : 'pi pi-file'}
                        severity="success"
                        onClick={handleExport}
                        disabled={searching || exporting}
                    />
                </div>
            </div>

            {/* Preview Results Table */}
            {previewData !== null && (
                <div className="bg-white rounded-xl p-4 md:p-6 mt-5">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <i className="pi pi-list" />
                        {t('dashboard.results.title', 'Filtered Results')}
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({previewData.length} {t('dashboard.results.records', 'records')})
                        </span>
                    </h3>

                    <DataTable
                        value={previewData}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="{first} to {last} of {totalRecords}"
                        dataKey="_rowIndex"
                        emptyMessage={t('dashboard.results.empty', 'No records match the current filters.')}
                        scrollable
                        tableStyle={{ minWidth: '60rem' }}
                        stripedRows
                    >
                        <Column field="Claim ID" header={t('dashboard.results.claimId', 'Claim ID')}
                            style={{ minWidth: '5rem' }} />
                        <Column field="Submitter" header={t('dashboard.results.submitter', 'Submitter')}
                            style={{ minWidth: '8rem' }} />
                        <Column field="Claim Type" header={t('dashboard.results.claimType', 'Claim Type')}
                            style={{ minWidth: '7rem' }} />
                        <Column field="Department" header={t('dashboard.results.department', 'Department')}
                            style={{ minWidth: '7rem' }} />
                        <Column field="Claim Submitted Date" header={t('dashboard.results.submittedDate', 'Submitted')}
                            style={{ minWidth: '7rem' }} />
                        <Column field="Total Claim Amount" header={t('dashboard.results.totalAmount', 'Amount')}
                            body={amountBodyTemplate}
                            style={{ minWidth: '6rem' }} />
                        <Column field="Claim Status" header={t('dashboard.results.status', 'Status')}
                            body={statusBodyTemplate}
                            style={{ minWidth: '6rem' }} />
                        <Column field="Expense Description" header={t('dashboard.results.description', 'Expense')}
                            style={{ minWidth: '10rem' }} />
                        <Column field="Vendor" header={t('dashboard.results.vendor', 'Vendor')}
                            style={{ minWidth: '7rem' }} />
                        <Column field="Expense Amount" header={t('dashboard.results.expenseAmount', 'Exp. Amount')}
                            style={{ minWidth: '6rem' }} />
                    </DataTable>
                </div>
            )}
        </>
    )
}

export default DashboardPage
