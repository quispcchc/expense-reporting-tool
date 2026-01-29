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
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { showToast } from '../../utils/helpers.js'
import { useTranslation } from 'react-i18next'
import ActiveStatusTab from '../../components/common/ui/ActiveStatusTab.jsx'

import { Dropdown } from 'primereact/dropdown'

function TagsPage() {
    const { t } = useTranslation()
    const toast = useRef(null)
    const { tags, loading: tagsLoading, error: tagsError, fetchTags, createTag, updateTag, deleteTag } = useTags()
    const { lookups, loading: lookupsLoading, error: lookupsError, refreshLookups } = useLookups()

    const [projectLoading, setProjectLoading] = useState(false)
    const [search, setSearch] = useState({ tag: '', project: '' })
    const [projectError, setProjectError] = useState(null)
    const { projects, loading: projectsLoading, error: projectsError, fetchProjects, createProject, updateProject, deleteProject } = useProjects()

    const [newTagLoading, setNewTagLoading] = useState(false);
    const [newTagError, setNewTagError] = useState('');

    const [showAddProject] = useState(false); // unused, form is always visible
    const [newProjectLoading, setNewProjectLoading] = useState(false);
    const [newProjectError, setNewProjectError] = useState('');

    const [isTagsOpen, setIsTagsOpen] = useState(false);
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);


    // Prepare dropdown options for department/status selectors
    const departmentOptions = (lookups.departments || []).map(d => ({ label: d.department_abbreviation, value: d.department_id }))
    const statusOptions = (lookups.activeStatuses || []).map(s => ({ label: s.active_status_name, value: s.active_status_id }))

    useEffect(() => {
        fetchTags()
        fetchProjects()
        refreshLookups()
    }, [])

    // Add new tag handler (collapsible form at top of tag section)
    const handleAddNewTag = async (tagName) => {
        setNewTagLoading(true);
        setNewTagError('');
        try {
            await createTag(tagName);
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: t('tags.added_success'), life: 2000 });
            await fetchTags();
            setShowAddTag(false);
        } catch (err) {
            setNewTagError(err?.message || t('tags.add_failed'));
        } finally {
            setNewTagLoading(false);
        }
    };


    // Inline edit for tags (row editing in DataTable)
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

    //Tag handlers (delete, confirm delete) 
    const handleDeleteTag = (tag) => {
        confirmDialog({
            message: t('tags.delete_confirm'),
            header: t('tags.delete_header'),
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    // You should implement a deleteTag method in TagContext for this
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

    // Fetch projects directly from API, not from lookup 
    // fetchProjects is now from context

    // Add new project handler (collapsible form at top of project section)
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


    // Inline edit for projects (row editing in DataTable)
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

    //  Project handlers (delete, confirm delete)

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


    //  Sort/filter tags and projects for display 
    const sortedTags = [...tags].filter(tag => tag && tag.tag_id && tag.tag_name).sort((a, b) => b.tag_id - a.tag_id)
    const filteredTags = sortedTags.filter(tag => tag && tag.tag_name && tag.tag_name.toLowerCase().includes(search.tag.toLowerCase()))

    // Sort projects so newest (highest id) is first
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

    // Dropdown editor for status field
    const statusEditor = (editorOptions) => (
        <Dropdown
            value={editorOptions.value}
            onChange={(e) => editorOptions.editorCallback(e.target.value)}
            options={statusOptions}
        />
    )


    const renderStatus = (rowData) => (<ActiveStatusTab status={rowData.active_status_id} />)

    // === Render main UI: Toast, Dialog, Tags section, Projects section ===
    return (
        <>
            <Toast ref={toast} position="top-right" />
            {/* PrimeReact confirmDialog is now used directly in handlers */}
            <ConfirmDialog />
            <ContentHeader title={t('tags_projects.title')} homePath="/admin" iconKey="sidebar.tags" />


            <div
                className="flex flex-col gap-8 mt-6 items-stretch w-full h-screen"
            >
                {/* TAGS SECTION*/}
                <div className="bg-white rounded-xl shadow p-4 mb-6 w-full">
                    <div
                        className="flex items-center justify-between cursor-pointer select-none px-2 py-3 border-b border-gray-300 hover:bg-gray-50 transition"
                        onClick={() => setIsTagsOpen(prev => !prev)}
                        aria-expanded={isTagsOpen}
                        role="button"
                        tabIndex={0}
                        onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setIsTagsOpen(prev => !prev) }}
                    >
                        <span className="text-xl font-semibold text-gray- flex items-center gap-2">
                            {t('tags.title')}
                            <i className={`pi ${isTagsOpen ? 'pi-chevron-up' : 'pi-chevron-down'} text-base ml-2`} />
                        </span>
                        <span className="text-gray-500 text-sm">{isTagsOpen ? t('common.collapse') : t('common.expand')}</span>
                    </div>

                    <div
                        className={`transition-all duration-300 ease-in-out overflow-scroll ${isTagsOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                        style={{ willChange: 'max-height, opacity' }}
                    >
                        <div className='m-4'>
                            {/* Add New Tag Always Visible */}
                            <div className="mb-4 mt-2 p-4 border border-gray-200 rounded bg-gray-50">
                                <AddTag
                                    onSave={handleAddNewTag}
                                    onCancel={() => { }}
                                    initialTag={null}
                                />
                                {newTagError && <div className="text-red-600 mt-2">{newTagError}</div>}
                            </div>
                            {/* Search Tag By Name */}
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <input
                                    type="text"
                                    className="p-inputtext p-component border rounded px-3 py-2 flex-1 min-w-[120px]"
                                    placeholder={t('tags.search_placeholder')}
                                    value={search.tag}
                                    onChange={e => setSearch(s => ({ ...s, tag: e.target.value }))}
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <DataTable value={filteredTags} loading={tagsLoading} emptyMessage={t('tags.empty_message')} editMode="row" onRowEditComplete={onTagRowEditComplete} className="mb-3" paginator
                                    rows={5}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
                                    currentPageReportTemplate="{first} to {last} of {totalRecords}">
                                    <Column
                                        field="tag_name"
                                        header={t('tags.name')}
                                        editor={textInputEditor}
                                    />
                                    <Column
                                        rowEditor={true}
                                        header={t('common.edit')}
                                    />
                                    <Column
                                        header={t('common.delete')}
                                        body={rowData => (
                                            <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteTag(rowData)} />
                                        )}
                                    />
                                </DataTable>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PROJECTS SECTION */}
                <div className="bg-white rounded-xl shadow p-4 mb-6 w-full">
                    <div
                        className="flex items-center justify-between cursor-pointer select-none px-2 py-3 border-b border-gray-300 hover:bg-gray-50 transition"
                        onClick={() => setIsProjectsOpen(prev => !prev)}
                        aria-expanded={isProjectsOpen}
                        role="button"
                        tabIndex={0}
                        onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setIsProjectsOpen(prev => !prev) }}
                    >
                        <span className="text-xl font-semibold text-gray- flex items-center gap-2">
                            {t('projects.title')}
                            <i className={`pi ${isProjectsOpen ? 'pi-chevron-up' : 'pi-chevron-down'} text-base ml-2`} />
                        </span>
                        <span className="text-gray-500 text-sm">{isProjectsOpen ? t('common.collapse') : t('common.expand')}</span>
                    </div>

                    <div
                        className={`transition-all duration-300 ease-in-out overflow-auto ${isProjectsOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                        style={{ willChange: 'max-height, opacity' }}
                    >
                        {/* Add New Project Always Visible */}
                        <div className="mb-4 mt-2 p-4 border border-gray-200 rounded bg-gray-50">
                            <AddProject
                                onSave={handleAddNewProject}
                                onCancel={() => { }}
                                initialProject={null}
                                departments={departmentOptions}
                                statuses={statusOptions}
                            />
                            {newProjectError && <div className="text-red-600 mt-2">{newProjectError}</div>}
                        </div>

                        <div className="m-2">
                            {/* Search Project By Name/Description */}
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <input
                                    type="text"
                                    className="p-inputtext p-component border rounded px-3 py-2 flex-1 min-w-[120px]"
                                    placeholder={t('projects.search_placeholder')}
                                    value={search.project}
                                    onChange={e => setSearch(s => ({ ...s, project: e.target.value }))}
                                />
                            </div>
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
                                >
                                    <Column
                                        field="project_name"
                                        header={t('projects.name')}
                                        editor={textInputEditor}
                                    />
                                    <Column
                                        field="project_desc"
                                        header={t('projects.description')}
                                        editor={textInputEditor}
                                    />
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
                                    <Column
                                        field="active_status_id"
                                        header={t('projects.status')}
                                        editor={statusEditor}
                                        body={renderStatus}
                                    />
                                    <Column
                                        rowEditor={true}
                                        header={t('common.edit')}
                                    />
                                    <Column
                                        header={t('common.delete')}
                                        body={rowData => (
                                            <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteProject(rowData)} />
                                        )}
                                    />
                                </DataTable>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TagsPage