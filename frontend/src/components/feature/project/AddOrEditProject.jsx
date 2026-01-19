import React, { useState, useEffect } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'

export default function AddOrEditProject({ onSave, onCancel, initialProject, departments, statuses }) {
    const [project, setProject] = useState({
        project_name: initialProject?.project_name || '',
        project_desc: initialProject?.project_desc || '',
        department_id: initialProject?.department_id || '',
        active_status_id: initialProject?.active_status_id || '',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        setProject({
            project_name: initialProject?.project_name || '',
            project_desc: initialProject?.project_desc || '',
            department_id: initialProject?.department_id || '',
            active_status_id: initialProject?.active_status_id || '',
        })
    }, [initialProject])

    const handleChange = (e) => {
        const { name, value } = e.target
        setProject(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = () => {
        if (!project.project_name.trim()) {
            setError('Project name is required')
            return
        }
        if (!project.department_id) {
            setError('Department is required')
            return
        }
        setError('')
        onSave(project)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InputText
                name="project_name"
                value={project.project_name}
                onChange={handleChange}
                placeholder="Project name"
                className={error && !project.project_name ? 'p-invalid' : ''}
            />
            <InputText
                name="project_desc"
                value={project.project_desc}
                onChange={handleChange}
                placeholder="Project description"
            />
            <Dropdown
                name="department_id"
                value={project.department_id}
                options={departments}
                onChange={handleChange}
                placeholder="Select Department"
                optionLabel="label"
                optionValue="value"
                className={error && !project.department_id ? 'p-invalid' : ''}
            />
            <Dropdown
                name="active_status_id"
                value={project.active_status_id}
                options={statuses}
                onChange={handleChange}
                placeholder="Select Status"
                optionLabel="label"
                optionValue="value"
            />
            {error && <small style={{ color: 'red' }}>{error}</small>}
            <div style={{ display: 'flex', gap: 8 }}>
                <Button label={initialProject ? 'Update' : 'Add'} onClick={handleSave} />
                <Button label="Cancel" className="p-button-secondary" onClick={onCancel} />
            </div>
        </div>
    )
}
