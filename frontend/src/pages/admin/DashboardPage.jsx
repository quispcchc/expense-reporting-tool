import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { Calendar } from 'primereact/calendar'
import { Dropdown } from 'primereact/dropdown'
import { MultiSelect } from 'primereact/multiselect'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ProgressSpinner } from 'primereact/progressspinner'
import { showToast } from '../../utils/helpers.js'
import api from '../../api/api.js'

const INITIAL_FILTERS = {
    dateRange: null,
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
    const [loading, setLoading] = useState(false)

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const clearFilters = () => {
        setFilters({ ...INITIAL_FILTERS })
    }

    const handleExport = async () => {
        setLoading(true)
        try {
            const params = {}

            // Map date range
            if (filters.dateRange && filters.dateRange[0]) {
                params.date_from = filters.dateRange[0].toISOString().split('T')[0]
            }
            if (filters.dateRange && filters.dateRange[1]) {
                params.date_to = filters.dateRange[1].toISOString().split('T')[0]
            }

            // Map simple filters
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

            const response = await api.get('claims/export-csv', {
                params,
                responseType: 'blob',
            })

            // Check for empty response
            if (response.data.size === 0) {
                showToast(toast, {
                    severity: 'warn',
                    summary: t('dashboard.export.noData', 'No Data'),
                    detail: t('dashboard.export.noDataDetail', 'No records match the current filters.'),
                })
                return
            }

            // Extract filename from Content-Disposition header if available
            const disposition = response.headers['content-disposition']
            let filename = 'claims_export.csv'
            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/)
                if (match) filename = match[1]
            }

            // Trigger download
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
            setLoading(false)
        }
    }

    // Dropdown options from lookups
    const claimTypeOptions = lookups.claimTypes.map(ct => ({
        label: ct.claim_type_name,
        value: ct.claim_type_id,
    }))

    const claimStatusOptions = lookups.claimStatus.map(cs => ({
        label: cs.claim_status_name,
        value: cs.claim_status_id,
    }))

    const departmentOptions = lookups.departments.map(d => ({
        label: d.department_name,
        value: d.department_id,
    }))

    const teamOptions = lookups.teams.map(tm => ({
        label: tm.team_name,
        value: tm.team_id,
    }))

    const projectOptions = lookups.projects.map(p => ({
        label: p.project_name,
        value: p.project_id,
    }))

    const costCentreOptions = lookups.costCentres.map(cc => ({
        label: `${cc.cost_centre_code} - ${cc.cost_centre_name ?? ''}`.trim(),
        value: cc.cost_centre_id,
    }))

    const tagOptions = lookups.tags.map(tg => ({
        label: tg.tag_name,
        value: tg.tag_id,
    }))

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
                    {/* Date Range */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-600">
                            {t('dashboard.filters.dateRange', 'Date Range')}
                        </label>
                        <Calendar
                            id="dateRange"
                            value={filters.dateRange}
                            onChange={e => updateFilter('dateRange', e.value)}
                            selectionMode="range"
                            readOnlyInput
                            showIcon
                            dateFormat="yy-mm-dd"
                            placeholder={t('dashboard.filters.selectDateRange', 'Select date range')}
                            className="w-full"
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
                            onChange={e => updateFilter('department_id', e.value)}
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
                            placeholder={t('dashboard.filters.selectAll', 'All')}
                            showClear
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

                    {/* Submitter Search */}
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
                        id="exportCsvBtn"
                        label={t('dashboard.export.button', 'Export to CSV')}
                        icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-file'}
                        severity="success"
                        onClick={handleExport}
                        disabled={loading}
                    />
                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ProgressSpinner
                                style={{ width: '20px', height: '20px' }}
                                strokeWidth="4"
                            />
                            {t('dashboard.export.loading', 'Generating CSV...')}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default DashboardPage
