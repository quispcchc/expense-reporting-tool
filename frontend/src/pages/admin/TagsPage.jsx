import React, { useEffect, useState, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useTags } from '../../contexts/TagContext.jsx'
import { useLookups } from '../../contexts/LookupContext.jsx'
import { useProjects } from '../../contexts/ProjectContext.jsx'
import AddTag from '../../components/feature/tag/AddTag.jsx'
import AddProject from '../../components/feature/project/AddProject.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { Dialog } from 'primereact/dialog'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { showToast } from '../../utils/helpers.js'
import { useTranslation } from 'react-i18next'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { useIsMobile } from '../../hooks/useIsMobile.js'

function TagsPage() {
    const { t } = useTranslation()
    const toast = useRef(null)
    const isMobile = useIsMobile()
    const { tags, loading: tagsLoading, error: tagsError, fetchTags, createTag, updateTag, deleteTag } = useTags()
    const { lookups, loading: lookupsLoading, error: lookupsError, refreshLookups } = useLookups()

    const [projectLoading, setProjectLoading] = useState(false)
    const [search, setSearch] = useState({ tag: '', project: '' })
    const [projectError, setProjectError] = useState(null)
    const { projects, loading: projectsLoading, error: projectsError, fetchProjects, createProject, updateProject, deleteProject } = useProjects()

    const [newTagLoading, setNewTagLoading] = useState(false);
    const [newTagError, setNewTagError] = useState('');

    const [showAddProject] = useState(false);
    const [newProjectLoading, setNewProjectLoading] = useState(false);
    const [newProjectError, setNewProjectError] = useState('');

    const [isTagsOpen, setIsTagsOpen] = useState(false);
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);

    // Mobile edit dialog state
    const [editTagDialog, setEditTagDialog] = useState(false)
    const [editTagData, setEditTagData] = useState(null)
    const [editProjectDialog, setEditProjectDialog] = useState(false)
    const [editProjectData, setEditProjectData] = useState(null)

    const departmentOptions = (lookups.departments || []).map(d => ({ label: d.department_abbreviation, value: d.department_id }))
    const statusOptions = (lookups.activeStatuses || []).map(s => ({ label: s.active_status_name, value: s.active_status_id }))

    useEffect(() => {
        fetchTags()
        fetchProjects()
    }, [])

    // Add new tag handler
    const handleAddNewTag = async (tagName) => {
        setNewTagLoading(true);
        setNewTagError('');
        try {
            await createTag(tagName);
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('tags.added_success'), life: 2000 });
            await fetchTags();
        } catch (err) {
            setNewTagError(err?.message || t('tags.add_failed'));
        } finally {
            setNewTagLoading(false);
        }
    };

    // Inline edit for tags
    const onTagRowEditComplete = async (e) => {
        const { newData } = e;
        try {
            await updateTag(newData.tag_id, newData.tag_name);
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('tags.updated_success'), life: 2000 });
            await fetchTags();
        } catch (err) {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: err?.message || t('tags.update_failed'), life: 3000 });
        }
    };

    const handleDeleteTag = (tag) => {
        confirmDialog({
            message: t('tags.delete_confirm'),
            header: t('tags.delete_header'),
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await deleteTag(tag.tag_id);
                    showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('tags.deleted_success'), life: 3000 })
                    await fetchTags();
                } catch (err) {
                    const detail = err?.message || t('tags.delete_failed')
                    showToast(toast, { severity: 'error', summary: t('common.error'), detail, life: 3000 })
                }
            },
            reject: () => { },
        })
    }

    // Add new project handler
    const handleAddNewProject = async (projectData) => {
        setNewProjectLoading(true);
        setNewProjectError('');
        try {
            await createProject(projectData);
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('projects.added_success'), life: 2000 });
            await fetchProjects();
        } catch (err) {
            setNewProjectError(err?.message || t('projects.add_failed'));
        } finally {
            setNewProjectLoading(false);
        }
    };

    const onProjectRowEditComplete = async (e) => {
        const { newData } = e;
        setProjectLoading(true);
        setProjectError(null);
        try {
            await updateProject(newData.project_id, newData);
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('projects.updated_success'), life: 2000 });
            await fetchProjects();
        } catch (err) {
            setProjectError(err.message || t('projects.update_failed'));
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: err?.message || t('projects.update_failed'), life: 3000 });
        } finally {
            setProjectLoading(false);
        }
    };

    const handleDeleteProject = (project) => {
        confirmDialog({
            message: t('projects.delete_confirm'),
            header: t('projects.delete_header'),
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                setProjectLoading(true)
                setProjectError(null)
                try {
                    await deleteProject(project.project_id);
                    showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('projects.deleted_success'), life: 2000 })
                    await fetchProjects();
                } catch (err) {
                    setProjectError(err.message || t('projects.delete_failed'))
                    showToast(toast, { severity: 'error', summary: t('common.error'), detail: err?.message || t('projects.delete_failed'), life: 2000 })
                } finally {
                    setProjectLoading(false)
                }
            },
            reject: () => { },
        })
    }

    // Mobile tag edit save
    const handleMobileTagEditSave = async () => {
        if (!editTagData) return
        try {
            await updateTag(editTagData.tag_id, editTagData.tag_name);
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('tags.updated_success'), life: 2000 });
            await fetchTags();
        } catch (err) {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: err?.message || t('tags.update_failed'), life: 3000 });
        }
        setEditTagDialog(false)
        setEditTagData(null)
    }

    // Mobile project edit save
    const handleMobileProjectEditSave = async () => {
        if (!editProjectData) return
        setProjectLoading(true)
        try {
            await updateProject(editProjectData.project_id, editProjectData);
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('projects.updated_success'), life: 2000 });
            await fetchProjects();
        } catch (err) {
            showToast(toast, { severity: 'error', summary: t('common.error'), detail: err?.message || t('projects.update_failed'), life: 3000 });
        } finally {
            setProjectLoading(false)
        }
        setEditProjectDialog(false)
        setEditProjectData(null)
    }

    // Sort/filter tags and projects
    const sortedTags = [...tags].filter(tag => tag && tag.tag_id && tag.tag_name).sort((a, b) => b.tag_id - a.tag_id)
    const filteredTags = sortedTags.filter(tag => tag && tag.tag_name && tag.tag_name.toLowerCase().includes(search.tag.toLowerCase()))

    const sortedProjects = [...projects].sort((a, b) => b.project_id - a.project_id)
    const filteredProjects = sortedProjects.filter(project => {
        const name = project.project_name || ''
        const desc = project.project_desc || ''
        return name.toLowerCase().includes(search.project.toLowerCase()) || desc.toLowerCase().includes(search.project.toLowerCase())
    })

    const textInputEditor = (options) => (
        <input
            type="text"
            value={options.value}
            onChange={e => options.editorCallback(e.target.value)}
            className="p-inputtext p-component"
        />
    )

    const statusEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={statusOptions}
        />
    )

    const renderStatus = (rowData) => (<ActiveStatusTab status={rowData.active_status_id} />)

    // Mobile tag cards
    const MobileTagCards = () => (
        <div className="admin-mobile-list">
            {filteredTags.length === 0 ? (
                <div className="text-center text-gray-500 py-4">{t('tags.empty_message')}</div>
            ) : (
                filteredTags.map(tag => (
                    <div key={tag.tag_id} className="admin-card">
                        <div className="admin-card-header">
                            <div className="admin-card-title">{tag.tag_name}</div>
                            <div className="flex gap-1">
                                <Button icon="pi pi-pencil" size="small" text onClick={() => { setEditTagData({ ...tag }); setEditTagDialog(true) }} />
                                <Button icon="pi pi-trash" size="small" text severity="danger" onClick={() => handleDeleteTag(tag)} />
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    )

    // Mobile project cards
    const MobileProjectCards = () => (
        <div className="admin-mobile-list">
            {filteredProjects.length === 0 ? (
                <div className="text-center text-gray-500 py-4">{t('projects.empty_message')}</div>
            ) : (
                filteredProjects.map(project => {
                    const dept = departmentOptions.find(d => d.value === project.department_id)
                    return (
                        <div key={project.project_id} className="admin-card">
                            <div className="admin-card-header">
                                <div>
                                    <div className="admin-card-title">{project.project_name}</div>
                                    <div className="admin-card-subtitle">{project.project_desc}</div>
                                </div>
                                <ActiveStatusTab status={project.active_status_id} />
                            </div>
                            <div className="admin-card-body">
                                <div className="admin-card-row">
                                    <span className="admin-card-label">{t('projects.department')}</span>
                                    <span className="admin-card-value">{dept?.label || '—'}</span>
                                </div>
                            </div>
                            <div className="admin-card-actions">
                                <Button icon="pi pi-pencil" size="small" text onClick={() => { setEditProjectData({ ...project }); setEditProjectDialog(true) }} />
                                <Button icon="pi pi-trash" size="small" text severity="danger" onClick={() => handleDeleteProject(project)} />
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    )

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />
            <ContentHeader title={t('tags_projects.title')} homePath="/admin" iconKey="sidebar.tags" />

            <div className="flex flex-col gap-8 mt-6 items-stretch w-full">
                {/* TAGS SECTION */}
                <div className="bg-white rounded-xl p-4 mb-6 w-full">
                    <div
                        className="flex items-center justify-between cursor-pointer select-none px-2 py-3 border-b border-gray-300 hover:bg-gray-50 transition"
                        onClick={() => setIsTagsOpen(prev => !prev)}
                        aria-expanded={isTagsOpen}
                        role="button"
                        tabIndex={0}
                        onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setIsTagsOpen(prev => !prev) }}
                    >
                        <span className="text-[22px] text-gray- flex items-center gap-2">
                            {t('tags.title')}
                            <i className={`pi ${isTagsOpen ? 'pi-chevron-up' : 'pi-chevron-down'} text-base ml-2`} />
                        </span>
                        <span className="text-gray-500 text-sm">{isTagsOpen ? t('common.collapse') : t('common.expand')}</span>
                    </div>

                    <div
                        className={`transition-all duration-300 ease-in-out ${isTagsOpen ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}
                        style={{ willChange: 'max-height, opacity' }}
                    >
                        <div className='m-2 md:m-4'>
                            <div className="mb-4 mt-2 p-3 md:p-4 border border-gray-200 rounded bg-gray-50">
                                <AddTag
                                    onSave={handleAddNewTag}
                                    onCancel={() => { }}
                                    initialTag={null}
                                />
                                {newTagError && <div className="text-red-600 mt-2">{newTagError}</div>}
                            </div>
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <input
                                    type="text"
                                    className="p-inputtext p-component border rounded px-3 py-2 flex-1 min-w-[120px]"
                                    placeholder={t('tags.search_placeholder')}
                                    value={search.tag}
                                    onChange={e => setSearch(s => ({ ...s, tag: e.target.value }))}
                                />
                            </div>
                            {isMobile ? (
                                <MobileTagCards />
                            ) : (
                                <div className="flex-1 overflow-y-auto">
                                    <DataTable value={filteredTags} loading={tagsLoading} emptyMessage={t('tags.empty_message')} editMode="row" onRowEditComplete={onTagRowEditComplete} className="mb-3" paginator
                                        rows={5}
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                        paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                                        currentPageReportTemplate="{first} to {last} of {totalRecords}"
                                        scrollable
                                        tableStyle={{ minWidth: '30rem' }}>
                                        <Column field="tag_name" header={t('tags.name')} editor={textInputEditor} />
                                        <Column rowEditor={true} header={t('common.edit')} />
                                        <Column header={t('common.delete')} body={rowData => (
                                            <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteTag(rowData)} />
                                        )} />
                                    </DataTable>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PROJECTS SECTION */}
                <div className="bg-white rounded-xl p-4 mb-6 w-full">
                    <div
                        className="flex items-center justify-between cursor-pointer select-none px-2 py-3 border-b border-gray-300 hover:bg-gray-50 transition"
                        onClick={() => setIsProjectsOpen(prev => !prev)}
                        aria-expanded={isProjectsOpen}
                        role="button"
                        tabIndex={0}
                        onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setIsProjectsOpen(prev => !prev) }}
                    >
                        <span className="text-[22px] text-gray- flex items-center gap-2">
                            {t('projects.title')}
                            <i className={`pi ${isProjectsOpen ? 'pi-chevron-up' : 'pi-chevron-down'} text-base ml-2`} />
                        </span>
                        <span className="text-gray-500 text-sm">{isProjectsOpen ? t('common.collapse') : t('common.expand')}</span>
                    </div>

                    <div
                        className={`transition-all duration-300 ease-in-out ${isProjectsOpen ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}
                        style={{ willChange: 'max-height, opacity' }}
                    >
                        <div className="mb-4 mt-2 p-3 md:p-4 border border-gray-200 rounded bg-gray-50">
                            <AddProject
                                onSave={handleAddNewProject}
                                onCancel={() => { }}
                                initialProject={{
                                    project_name: '',
                                    project_desc: '',
                                    department_id: '',
                                }}
                                departments={departmentOptions}
                                statuses={statusOptions}
                            />
                            {newProjectError && <div className="text-red-600 mt-2">{newProjectError}</div>}
                        </div>

                        <div className="m-2">
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <input
                                    type="text"
                                    className="p-inputtext p-component border rounded px-3 py-2 flex-1 min-w-[120px]"
                                    placeholder={t('projects.search_placeholder')}
                                    value={search.project}
                                    onChange={e => setSearch(s => ({ ...s, project: e.target.value }))}
                                />
                            </div>
                            {isMobile ? (
                                <MobileProjectCards />
                            ) : (
                                <div className="flex-1 overflow-y-auto">
                                    <DataTable
                                        value={filteredProjects}
                                        loading={lookupsLoading || projectLoading}
                                        emptyMessage={t('projects.empty_message')}
                                        className="mb-3"
                                        editMode="row"
                                        onRowEditComplete={onProjectRowEditComplete}
                                        paginator
                                        rows={5}
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                        paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                                        currentPageReportTemplate="{first} to {last} of {totalRecords}"
                                        scrollable
                                        tableStyle={{ minWidth: '50rem' }}
                                    >
                                        <Column field="project_name" header={t('projects.name')} editor={textInputEditor} />
                                        <Column field="project_desc" header={t('projects.description')} editor={textInputEditor} />
                                        <Column
                                            field="department_id"
                                            header={t('projects.department')}
                                            editor={options => (
                                                <Dropdown
                                                    value={options.value}
                                                    options={departmentOptions}
                                                    onChange={e => options.editorCallback(e.value)}
                                                    placeholder={t('projects.select_department')}
                                                    optionLabel="label"
                                                    optionValue="value"
                                                />
                                            )}
                                            body={rowData => {
                                                const dept = departmentOptions.find(d => d.value === rowData.department_id)
                                                return dept ? dept.label : ''
                                            }}
                                        />
                                        <Column field="active_status_id" header={t('projects.status')} editor={statusEditor} body={renderStatus} />
                                        <Column rowEditor={true} header={t('common.edit')} />
                                        <Column header={t('common.delete')} body={rowData => (
                                            <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteProject(rowData)} />
                                        )} />
                                    </DataTable>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Tag Edit Dialog */}
            <Dialog
                header={t('tags.editTag', 'Edit Tag')}
                visible={editTagDialog}
                style={{ width: '90vw', maxWidth: '450px' }}
                onHide={() => { setEditTagDialog(false); setEditTagData(null) }}
                className="mobile-edit-dialog"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={() => { setEditTagDialog(false); setEditTagData(null) }} />
                        <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={handleMobileTagEditSave} />
                    </div>
                }
            >
                {editTagData && (
                    <div className="edit-field">
                        <label>{t('tags.name')}</label>
                        <InputText
                            value={editTagData.tag_name || ''}
                            onChange={(e) => setEditTagData({ ...editTagData, tag_name: e.target.value })}
                        />
                    </div>
                )}
            </Dialog>

            {/* Mobile Project Edit Dialog */}
            <Dialog
                header={t('projects.editProject', 'Edit Project')}
                visible={editProjectDialog}
                style={{ width: '90vw', maxWidth: '450px' }}
                onHide={() => { setEditProjectDialog(false); setEditProjectData(null) }}
                className="mobile-edit-dialog"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={() => { setEditProjectDialog(false); setEditProjectData(null) }} />
                        <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={handleMobileProjectEditSave} />
                    </div>
                }
            >
                {editProjectData && (
                    <>
                        <div className="edit-field">
                            <label>{t('projects.name')}</label>
                            <InputText
                                value={editProjectData.project_name || ''}
                                onChange={(e) => setEditProjectData({ ...editProjectData, project_name: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('projects.description')}</label>
                            <InputText
                                value={editProjectData.project_desc || ''}
                                onChange={(e) => setEditProjectData({ ...editProjectData, project_desc: e.target.value })}
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('projects.department')}</label>
                            <Dropdown
                                value={editProjectData.department_id}
                                onChange={(e) => setEditProjectData({ ...editProjectData, department_id: e.value })}
                                options={departmentOptions}
                                optionLabel="label"
                                optionValue="value"
                            />
                        </div>
                        <div className="edit-field">
                            <label>{t('projects.status')}</label>
                            <Dropdown
                                value={editProjectData.active_status_id}
                                onChange={(e) => setEditProjectData({ ...editProjectData, active_status_id: e.value })}
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

export default TagsPage