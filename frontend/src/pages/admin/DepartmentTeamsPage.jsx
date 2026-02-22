import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { DataTable } from 'primereact/datatable'
import StatusTab from '../../components/common/ui/StatusTab.jsx'
import { InputText } from 'primereact/inputtext'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { FilterMatchMode } from 'primereact/api'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../../hooks/useIsMobile.js'
import api from '../../api/api.js'

// Module-level cache: persists across mount/unmount cycles
// Key: departmentId, Value: { department, teams }
const deptTeamsCache = {}

function DepartmentTeamsPage() {
    const { t } = useTranslation()
    const { departmentId } = useParams()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

    // Initialize from cache if available
    const cached = deptTeamsCache[departmentId]
    const [departmentData, setDepartmentData] = useState(cached?.department || null)
    const [teams, setTeams] = useState(cached?.teams || [])
    const [loading, setLoading] = useState(!cached)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [formErrors, setFormErrors] = useState([])
    const isFetching = useRef(false)

    const { lookups, refreshLookups } = useLookups()
    const toast = useRef(null)

    // Mobile edit dialog state
    const [editDialog, setEditDialog] = useState(false)
    const [editData, setEditData] = useState(null)

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
    const fetchData = React.useCallback(async (force = false) => {
        // Use cache if available and not forced
        if (!force && deptTeamsCache[departmentId]) {
            setDepartmentData(deptTeamsCache[departmentId].department)
            setTeams(deptTeamsCache[departmentId].teams)
            setLoading(false)
            return
        }

        if (isFetching.current) return
        isFetching.current = true
        setLoading(true)
        try {
            const response = await api.get(`/departments/${departmentId}/teams`)
            const department = response.data.department
            const fetchedTeams = response.data.teams || []
            // Update cache
            deptTeamsCache[departmentId] = { department, teams: fetchedTeams }
            setDepartmentData(department)
            setTeams(fetchedTeams)
        } catch (err) {
            console.error('Failed to fetch department teams:', err)
        } finally {
            isFetching.current = false
            setLoading(false)
        }
    }, [departmentId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // State for global filter input and DataTable filters
    const [globalFilterValue, setGlobalFilterValue] = useState('')
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    const onGlobalFilterChange = (e) => {
        const value = e.target.value
        let _filters = { ...filters }
        _filters['global'].value = value
        setFilters(_filters)
        setGlobalFilterValue(value)
    }

    const renderStatus = (rowData) => {
        const status = lookups.activeStatuses.find(s => s.active_status_id === rowData.active_status_id)
        return <StatusTab status={status?.active_status_name || 'Unknown'} />
    }

    const textInputEditor = (editorOptions) => (
        <InputText
            type="text"
            value={editorOptions.value || ''}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            className="w-full"
        />
    )

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

    const onRowEditComplete = async (e) => {
        const { newData } = e
        try {
            await api.put(`/teams/${newData.team_id}`, newData)
            await fetchData(true)
            toast.current.show({ severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: 3000 })
            await refreshLookups()
        } catch (err) {
            console.error('Failed to update team:', err)
            toast.current.show({ severity: 'error', summary: t('common.error'), detail: err.message || t('teams.updateError', 'Failed to update team'), life: 5000 })
            try {
                await fetchData(true)
            } catch (fetchErr) {
                console.error('Failed to revert team changes:', fetchErr)
            }
        }
    }

    const handleDeleteTeam = (rowData) => {
        confirmDialog({
            message: t('teams.deleteConfirmMessage', { name: rowData.team_name }),
            header: t('teams.deleteConfirmTitle'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await api.delete(`/teams/${rowData.team_id}`)
                    await fetchData(true)
                    toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('teams.deleteSuccess'), life: 3000 })
                    await refreshLookups()
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err.message, life: 5000 })
                }
            },
        })
    }

    // Mobile edit dialog save
    const handleMobileEditSave = async () => {
        if (!editData) return
        try {
            await api.put(`/teams/${editData.team_id}`, editData)
            await fetchData(true)
            toast.current?.show({ severity: 'success', summary: t('common.success'), detail: t('teams.updateSuccess', 'Team updated successfully'), life: 3000 })
            await refreshLookups()
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: t('common.error'), detail: err.message || t('teams.updateError', 'Failed to update team'), life: 5000 })
        }
        setEditDialog(false)
        setEditData(null)
    }

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        const errors = []
        if (!formData.team_abbreviation) errors.push({ field: 'team_abbreviation', message: t('validation.codeRequired') })
        if (!formData.team_name) errors.push({ field: 'team_name', message: t('validation.nameRequired') })
        if (!formData.active_status_id) errors.push({ field: 'active_status_id', message: t('validation.statusRequired') })
        if (errors.length > 0) { setFormErrors(errors); return }

        try {
            await api.post('/teams', { ...formData, department_id: parseInt(departmentId) })
            await fetchData(true)
            setFormData({ team_abbreviation: '', team_name: '', team_desc: '', active_status_id: '' })
            setFormErrors([])
            setIsFormOpen(false)
            await refreshLookups()
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message
            setFormErrors([{ field: '', message: errorMessage }])
        }
    }

    // Render the search bar
    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center flex-wrap gap-2">
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

    // Filter teams for mobile search
    const filteredTeams = teams?.filter(team => {
        if (!globalFilterValue) return true
        const q = globalFilterValue.toLowerCase()
        return (
            team.team_abbreviation?.toLowerCase().includes(q) ||
            team.team_name?.toLowerCase().includes(q)
        )
    }) || []

    const breadcrumbItems = [
        { label: t('common.home'), path: '/admin' },
        { label: t('departments.title'), path: '/admin/departments' },
        { label: t('teams.title'), path: null },
    ]

    // Mobile card view
    const mobileCardView = (
        <div className="admin-mobile-container">
            <div className="admin-mobile-search">
                <div className="flex items-center gap-2 w-full">
                    <Button
                        icon="pi pi-reply"
                        rounded
                        text
                        severity="secondary"
                        onClick={() => navigate('/admin/departments')}
                    />
                    <IconField iconPosition="left" className="flex-1">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder={t('common.keywordSearch')}
                            className="w-full"
                        />
                    </IconField>
                </div>
            </div>

            <div className="mb-2 px-1">
                <h3 className="text-base font-semibold text-gray-700">
                    {departmentData?.department_name || t('common.loading')}
                </h3>
            </div>

            <div className="admin-mobile-list">
                {filteredTeams.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {t('common.noResults')}
                    </div>
                ) : (
                    filteredTeams.map(team => {
                        const status = lookups.activeStatuses.find(s => s.active_status_id === team.active_status_id)
                        const statusName = status?.active_status_name || 'Unknown'
                        return (
                            <div key={team.team_id} className="admin-card">
                                <div className="admin-card-header">
                                    <div>
                                        <div className="admin-card-title">{team.team_name}</div>
                                        <div className="admin-card-subtitle">{team.team_abbreviation}</div>
                                    </div>
                                    <StatusTab status={statusName} />
                                </div>
                                <div className="admin-card-actions">
                                    <Button
                                        icon="pi pi-pencil"
                                        size="small"
                                        text
                                        onClick={() => {
                                            setEditData({ ...team })
                                            setEditDialog(true)
                                        }}
                                    />
                                    <Button
                                        icon="pi pi-trash"
                                        size="small"
                                        text
                                        severity="danger"
                                        onClick={() => handleDeleteTeam(team)}
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
                dataKey="team_id"
                onRowEditComplete={onRowEditComplete}
                filters={filters}
                globalFilterFields={['team_abbreviation', 'team_name', 'active_status_id']}
                header={renderHeader()}
                emptyMessage={t('common.noResults')}
                sortMode="multiple"
                removableSort
                loading={loading}
                scrollable
                tableStyle={{ minWidth: '40rem' }}
            >
                <Column field="team_abbreviation" header={t('teams.code')} sortable editor={textInputEditor}></Column>
                <Column field="team_name" header={t('teams.name')} sortable editor={textInputEditor}></Column>
                <Column field="active_status_id" header={t('common.status')} body={renderStatus} sortable editor={statusEditor}></Column>
                <Column rowEditor={true} header={t('common.edit')} headerStyle={{ width: '4rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
                <Column header={t('common.delete')} body={(rowData) => (
                    <Button icon="pi pi-trash" rounded text severity="danger" tooltip={t('common.delete')} tooltipOptions={{ position: 'top' }} onClick={() => handleDeleteTeam(rowData)} />
                )} headerStyle={{ width: '4rem' }} bodyStyle={{ textAlign: 'center' }}></Column>
            </DataTable>
        </div>
    )

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <ContentHeader
                title={t('teams.title')}
                homePath="/admin"
                iconKey="sidebar.teams"
                breadcrumbItems={breadcrumbItems}
            />

            {/* Add new team form */}
            <div className="bg-white rounded-xl p-4 md:p-6">
                <div className="flex justify-between items-center text-gray-700">
                    <div>
                        <h4 className="text-lg md:text-[22px]">{t('teams.addNewTeam')}</h4>
                        <p className="text-xs text-gray-500">{t('teams.addNewTeamDescription')}</p>
                    </div>
                    <button
                        className={`pi ${isFormOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                        onClick={() => setIsFormOpen(prev => !prev)}
                    ></button>
                </div>

                {isFormOpen && (
                    <form
                        className={`my-5 grid grid-cols-1 sm:grid-cols-8 ${formErrors.length === 0 ? "items-end" : "items-center"} gap-3 md:gap-5`}
                        onSubmit={handleFormSubmit}
                    >
                        <div className="sm:col-span-2">
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
                        <div className="sm:col-span-3">
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
                        <div className="sm:col-span-2">
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
                        <div className="sm:col-span-1 flex items-center">
                            <Button label={t('common.addNew')} className="!h-[48px] w-full" />
                        </div>
                        {formErrors.find(e => e.field === '') && (
                            <div className="col-span-full mt-2">
                                <small className="text-red-500 font-bold block bg-red-50 p-2 rounded border border-red-200">
                                    <i className="pi pi-exclamation-circle mr-2"></i>
                                    {formErrors.find(e => e.field === '').message}
                                </small>
                            </div>
                        )}
                    </form>
                )}
            </div>

            {/* Teams list */}
            {isMobile ? mobileCardView : desktopTableView}

            {/* Mobile Edit Dialog */}
            <Dialog
                header={t('teams.editTeam', 'Edit Team')}
                visible={editDialog}
                style={{ width: '90vw', maxWidth: '450px' }}
                onHide={() => { setEditDialog(false); setEditData(null) }}
                className="mobile-edit-dialog"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={() => { setEditDialog(false); setEditData(null) }} />
                        <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={handleMobileEditSave} />
                    </div>
                }
            >
                {editData && (
                    <>
                        <div className="edit-field">
                            <label>{t('teams.code')}</label>
                            <InputText
                                value={editData.team_abbreviation || ''}
                                onChange={(e) => setEditData({ ...editData, team_abbreviation: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('teams.name')}</label>
                            <InputText
                                value={editData.team_name || ''}
                                onChange={(e) => setEditData({ ...editData, team_name: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('common.status')}</label>
                            <Dropdown
                                value={editData.active_status_id}
                                onChange={(e) => setEditData({ ...editData, active_status_id: e.value })}
                                options={statusOptions}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                    </>
                )}
            </Dialog>
        </>
    )
}

export default DepartmentTeamsPage
