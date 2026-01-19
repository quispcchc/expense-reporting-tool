import React, { useEffect, useState, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useTags } from '../../contexts/TagContext.jsx'
import { useLookups } from '../../contexts/LookupContext.jsx'
import AddOrEditTag from '../../components/feature/tag/AddOrEditTag.jsx'
import AddOrEditProject from '../../components/feature/project/AddOrEditProject.jsx'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { showToast } from '../../utils/helpers.js'
import api from '../../api/api.js'

function TagsPage() {
    const toast = useRef(null)
    const { tags, loading: tagsLoading, error: tagsError, fetchTags, createTag, updateTag, deleteTag } = useTags()
    const { lookups, loading: lookupsLoading, error: lookupsError, refreshLookups } = useLookups()
    const [showTagDialog, setShowTagDialog] = useState(false)
    const [editingTag, setEditingTag] = useState(null)
    const [showProjectDialog, setShowProjectDialog] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [projectLoading, setProjectLoading] = useState(false)
    const [search, setSearch] = useState({ tag: '', project: '' })
    const [projectError, setProjectError] = useState(null)
    const [projects, setProjects] = useState([])

    useEffect(() => {
        fetchTags()
        fetchProjects()
        refreshLookups()
    }, [])

    // Fetch projects directly from API, not from lookup
    const fetchProjects = async () => {
        try {
            const res = await api.get('projects')
            setProjects(res.data)
        } catch (err) {
            showToast(toast, { severity: 'error', summary: 'Error', detail: 'Failed to fetch projects', life: 3000 })
        }
    }

    const filteredTags = tags.filter(tag => tag.tag_name?.toLowerCase().includes(search.tag.toLowerCase()))
    const filteredProjects = projects.filter(project => {
        const name = project.project_name || ''
        const desc = project.project_desc || ''
        return name.toLowerCase().includes(search.project.toLowerCase()) || desc.toLowerCase().includes(search.project.toLowerCase())
    })

    // Tag handlers
    const handleAddTag = () => { setEditingTag(null); setShowTagDialog(true) }
    const handleEditTag = tag => { setEditingTag(tag); setShowTagDialog(true) }
    const handleSaveTag = async tagName => {
        try {
            if (editingTag) await updateTag(editingTag.tag_id, tagName)
            else await createTag(tagName)
            showToast(toast, { severity: 'success', summary: 'Success', detail: editingTag ? 'Tag updated successfully' : 'Tag added successfully', life: 2000 })
        } catch (err) {
            showToast(toast, { severity: 'error', summary: 'Error', detail: err?.message || 'Failed to save tag', life: 3000 })
        }
        setShowTagDialog(false)
    }
    const handleDeleteTag = async tag => {
        if (!window.confirm('Delete this tag?')) return
        try {
            await deleteTag(tag.tag_id)
            showToast(toast, { severity: 'success', summary: 'Success', detail: 'Tag deleted successfully', life: 2000 })
        } catch (err) {
            showToast(toast, { severity: 'error', summary: 'Error', detail: err?.message || 'Failed to delete tag', life: 3000 })
        }
    }

    // Project handlers
    const handleAddProject = () => { setEditingProject(null); setShowProjectDialog(true) }
    const handleEditProject = project => { setEditingProject(project); setShowProjectDialog(true) }
    const handleSaveProject = async projectData => {
        setProjectLoading(true)
        setProjectError(null)
        try {
            if (editingProject) {
                await api.put(`projects/${editingProject.project_id}`, { ...projectData, project_id: editingProject.project_id })
                showToast(toast, { severity: 'success', summary: 'Success', detail: 'Project updated successfully', life: 2000 })
            } else {
                await api.post('projects', projectData)
                showToast(toast, { severity: 'success', summary: 'Success', detail: 'Project added successfully', life: 2000 })
            }
            await fetchProjects()
        } catch (err) {
            setProjectError(err.message || 'Failed to save project')
            showToast(toast, { severity: 'error', summary: 'Error', detail: err?.message || 'Failed to save project', life: 3000 })
        } finally {
            setProjectLoading(false)
            setShowProjectDialog(false)
        }
    }
    const handleDeleteProject = async project => {
        if (!window.confirm('Delete this project?')) return
        setProjectLoading(true)
        setProjectError(null)
        try {
            await api.delete(`projects/${project.project_id}`)
            showToast(toast, { severity: 'success', summary: 'Success', detail: 'Project deleted successfully', life: 2000 })
            await fetchProjects()
        } catch (err) {
            setProjectError(err.message || 'Failed to delete project')
            showToast(toast, { severity: 'error', summary: 'Error', detail: err?.message || 'Failed to delete project', life: 3000 })
        } finally {
            setProjectLoading(false)
        }
    }

    // Prepare dropdown options
    const departmentOptions = (lookups.departments || []).map(d => ({ label: d.department_abbreviation, value: d.department_id }))
    const statusOptions = (lookups.activeStatuses || []).map(s => ({ label: s.active_status_name, value: s.active_status_id }))

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <ContentHeader title="Tags & Projects" homePath="/admin" iconKey="sidebar.tags" />
            <div
                className="flex flex-col md:flex-row gap-8 mt-6 items-stretch w-full"
            >
                {/* TAGS SECTION - align left */}
                <div
                    className="bg-white rounded-xl shadow-md p-7 mb-6 min-w-[320px] w-full md:w-2/5 flex flex-col h-[70vh] min-h-[400px]"
                >
                    <h2 className="mt-0 mb-4 text-xl font-semibold">Tags</h2>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <input
                            type="text"
                            className="p-inputtext p-component border rounded px-3 py-2 flex-1 min-w-[120px]"
                            placeholder="Search tags..."
                            value={search.tag}
                            onChange={e => setSearch(s => ({ ...s, tag: e.target.value }))}
                        />
                        <Button
                            label="Add Tag"
                            icon="pi pi-plus"
                            iconPos="left"
                            onClick={handleAddTag}
                            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 w-full md:w-auto"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <DataTable value={filteredTags} loading={tagsLoading} emptyMessage="No tags found" className="mb-3">
                            <Column
                                field="tag_name"
                                header="Tag Name"
                                body={rowData =>
                                    rowData.tag_name
                                        ? rowData.tag_name.replace(/\w\S*/g, (w) => w.replace(/^\w/, c => c.toUpperCase()))
                                        : ''
                                }
                            />
                            <Column
                                header="Actions"
                                body={rowData => (
                                    <>
                                        <Button icon="pi pi-pencil" className="p-button-text" onClick={() => handleEditTag(rowData)} />
                                        <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteTag(rowData)} />
                                    </>
                                )}
                                style={{ width: 120 }}
                            />
                        </DataTable>
                    </div>
                    {tagsError && <div style={{ color: 'red' }}>{tagsError}</div>}
                    {showTagDialog && (
                        <div className="p-dialog-mask p-dialog-visible flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}>
                            <div className="p-dialog" style={{ width: 400, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
                                <AddOrEditTag
                                    initialTag={editingTag}
                                    onSave={handleSaveTag}
                                    onCancel={() => setShowTagDialog(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* PROJECTS SECTION - align right */}
                <div
                    className="bg-white rounded-xl shadow-md p-7 mb-6 min-w-[320px] max-w-[60%] flex-1 flex flex-col"
                    style={{ height: '70vh', minHeight: 400 }}
                >
                    <h2 className="mt-0 mb-4 text-xl font-semibold">Projects</h2>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <input
                            type="text"
                            className="p-inputtext p-component border rounded px-3 py-2 flex-1 min-w-[120px]"
                            placeholder="Search projects..."
                            value={search.project}
                            onChange={e => setSearch(s => ({ ...s, project: e.target.value }))}
                        />
                        <Button
                            label="Add Project"
                            icon="pi pi-plus"
                            iconPos="left"
                            onClick={handleAddProject}
                            className="ml-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-4 py-2 w-full md:w-auto"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <DataTable value={filteredProjects} loading={lookupsLoading || projectLoading} emptyMessage="No projects found" className="mb-3">
                            <Column field="project_name" header="Project Name" />
                            <Column field="project_desc" header="Description" />
                            <Column field="department_id" header="Department" body={rowData => {
                                const dept = departmentOptions.find(d => d.value === rowData.department_id)
                                return dept ? dept.label : ''
                            }} />
                            <Column field="active_status_id" header="Status" body={rowData => {
                                const status = statusOptions.find(s => s.value === rowData.active_status_id)
                                return status ? status.label : ''
                            }} />
                            <Column
                                header="Actions"
                                body={rowData => (
                                    <>
                                        <Button icon="pi pi-pencil" className="p-button-text" onClick={() => handleEditProject(rowData)} />
                                        <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteProject(rowData)} />
                                    </>
                                )}
                                style={{ width: 120 }}
                            />
                        </DataTable>
                    </div>
                
                    {showProjectDialog && (
                        <div className="p-dialog-mask p-dialog-visible flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}>
                            <div className="p-dialog" style={{ width: 500, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
                                <AddOrEditProject
                                    initialProject={editingProject}
                                    onSave={handleSaveProject}
                                    onCancel={() => setShowProjectDialog(false)}
                                    departments={departmentOptions}
                                    statuses={statusOptions}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default TagsPage