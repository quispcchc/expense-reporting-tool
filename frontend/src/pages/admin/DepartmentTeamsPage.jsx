import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { DataTable } from 'primereact/datatable'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { InputText } from 'primereact/inputtext'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { FilterMatchMode } from 'primereact/api'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import api from '../../api/api.js'

function DepartmentTeamsPage() {
    const { t } = useTranslation()
    const { departmentId } = useParams()
    const navigate = useNavigate()

    // Local state for this department's data
    const [departmentData, setDepartmentData] = useState(null)
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formErrors, setFormErrors] = useState([])
    const isFetching = useRef(false)

    const { lookups, refreshLookups } = useLookups()
    const toast = useRef(null)

    // Get active statuses from lookups
    const statusOptions = lookups.activeStatuses.map(s => ({
        label: s.active_status_name,
        value: s.active_status_id
    }))

    // Form state for adding new team
    const [formData, setFormData] = useState({
        team_abbreviation: '',
        team_name: '',
        team_desc: '',
        active_status_id: '',
    })

    // Fetch department and its teams
    useEffect(() => {
        async function fetchData() {
            // Prevent duplicate calls from React StrictMode
            if (isFetching.current) {
                return
            }

            isFetching.current = true
            setLoading(true)
            try {
                const response = await api.get(`/departments/${departmentId}/teams`)
                setDepartmentData(response.data.department)
                setTeams(response.data.teams || [])
            } catch (err) {
                console.error('Failed to fetch department teams:', err)
            } finally {
                isFetching.current = false
                setLoading(false)
            }
        }
        fetchData()
    }, [departmentId])

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
            onChange={(e) => editorOptions.editorCallback(e.value)}
            options={statusOptions}
            optionLabel="label"
            optionValue="value"
            placeholder={t('filter.selectOne')}
        />
    )

    // Handle row edit completion: update team via API
    const onRowEditComplete = async (e) => {
        const { newData } = e
        try {
            const response = await api.put(`/teams/${newData.team_id}`, newData)
            setTeams(prev => prev.map(team =>
                team.team_id === newData.team_id ? response.data : team
            ))
            await refreshLookups()
        } catch (err) {
            console.error('Failed to update team:', err)
        }
    }

    // Handle delete team with confirmation
    const handleDeleteTeam = (rowData) => {
        confirmDialog({
            message: t('teams.deleteConfirmMessage', { name: rowData.team_name }),
            header: t('teams.deleteConfirmTitle'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.delete(`/teams/${rowData.team_id}`)
                    setTeams(prev => prev.filter(team => team.team_id !== rowData.team_id))
                    toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('teams.deleteSuccess'), life: 3000 })
                    await refreshLookups()
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err.message, life: 5000 })
                }
            },
        })
    }

    // Delete button template
    const deleteTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                tooltip={t('common.delete')}
                tooltipOptions={{ position: 'top' }}
                onClick={() => handleDeleteTeam(rowData)}
            />
        )
    }

    // Handle form input changes
    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    // Handle form submission to create new team
    const handleFormSubmit = async (e) => {
        e.preventDefault()

        // Simple validation
        const errors = []
        if (!formData.team_abbreviation) {
            errors.push({ field: 'team_abbreviation', message: t('validation.codeRequired') })
        }
        if (!formData.team_name) {
            errors.push({ field: 'team_name', message: t('validation.nameRequired') })
        }
        if (!formData.active_status_id) {
            errors.push({ field: 'active_status_id', message: t('validation.statusRequired') })
        }

        if (errors.length > 0) {
            setFormErrors(errors)
            return
        }

        try {
            const response = await api.post('/teams', {
                ...formData,
                department_id: parseInt(departmentId),
            })
            setTeams(prev => [...prev, response.data])
            setFormData({
                team_abbreviation: '',
                team_name: '',
                team_desc: '',
                active_status_id: '',
            })
            setFormErrors([])
            setIsFormOpen(false)
            await refreshLookups()
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message
            setFormErrors([{ field: '', message: errorMessage }])
        }
    }

    // Render the search bar above the DataTable with back button
    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center">
                <Button
                    icon="pi pi-reply"
                    rounded
                    text
                    severity="secondary"
                    tooltip={t('common.goBack')}
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => navigate('/admin/departments')}
                />
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

    // Build breadcrumb items
    const breadcrumbItems = [
        { label: t('common.home'), path: '/admin' },
        { label: t('departments.title'), path: '/admin/departments' },
        { label: t('teams.title'), path: null },
    ]

    return (
        <>
            {/* Page title and navigation */}
            <ContentHeader
                title={t('teams.title')}
                homePath="/admin"
                iconKey="sidebar.teams"
                breadcrumbItems={breadcrumbItems}
            />

            {/* Add new team form */}
            <div className="bg-white rounded-xl p-6">
                <div className="flex justify-between items-center text-gray-700">
                    <div>
                        <h4 className="text-[22px]">{t('teams.addNewTeam')}</h4>
                        <p className="text-xs text-gray-500">{t('teams.addNewTeamDescription')}</p>
                    </div>
                    <button
                        className={`pi ${isFormOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                        onClick={() => setIsFormOpen(prev => !prev)}
                    ></button>
                </div>

                {isFormOpen && (
                    <form
                        className={`my-5 grid grid-cols-1 sm:grid-cols-8 ${formErrors.length === 0 ? "items-end" : "items-center"} gap-5`}
                        onSubmit={handleFormSubmit}
                    >
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teams.code')}</label>
                            <InputText
                                name="team_abbreviation"
                                value={formData.team_abbreviation}
                                onChange={handleFormChange}
                                placeholder={t('costCentre.enterCode')}
                                className="w-full"
                            />
                            {formErrors.find(e => e.field === 'team_abbreviation') && (
                                <small className="text-red-500">{formErrors.find(e => e.field === 'team_abbreviation').message}</small>
                            )}
                        </div>
                        <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('teams.name')}</label>
                            <InputText
                                name="team_name"
                                value={formData.team_name}
                                onChange={handleFormChange}
                                placeholder={t('departments.enterName', 'Enter name')}
                                className="w-full"
                            />
                            {formErrors.find(e => e.field === 'team_name') && (
                                <small className="text-red-500">{formErrors.find(e => e.field === 'team_name').message}</small>
                            )}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.status')}</label>
                            <Dropdown
                                name="active_status_id"
                                value={formData.active_status_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, active_status_id: e.value }))}
                                options={statusOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder={t('filter.selectOne')}
                                className="w-full"
                            />
                            {formErrors.find(e => e.field === 'active_status_id') && (
                                <small className="text-red-500">{formErrors.find(e => e.field === 'active_status_id').message}</small>
                            )}
                        </div>
                        <Button label={t('common.addNew')} className="!h-[48px]" />
                    </form>
                )}
            </div>

            {/* Teams DataTable */}
            <div className="bg-white rounded-xl p-6 mt-5">
                {/* Department name header */}
                <div className="mb-4 pb-2 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">
                        {departmentData?.department_name || t('common.loading')}
                    </h3>
                </div>
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
                    loading={loading}
                >
                    <Column field="team_abbreviation" header={t('teams.code')} sortable editor={textInputEditor}></Column>
                    <Column field="team_name" header={t('teams.name')} sortable editor={textInputEditor}></Column>
                    <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable editor={statusEditor}></Column>
                    <Column rowEditor={true} header={t('common.edit')} headerStyle={{ width: '4rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column header={t('common.delete')} body={deleteTemplate} headerStyle={{ width: '4rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
                <ConfirmDialog />
                <Toast ref={toast} />
            </div>
        </>
    )
}

export default DepartmentTeamsPage
