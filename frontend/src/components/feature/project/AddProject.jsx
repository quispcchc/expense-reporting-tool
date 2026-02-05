import React, { useState, useEffect } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'

export default function AddProject({ onSave, onCancel, initialProject, departments }) {
    const { t } = useTranslation()
    const [project, setProject] = useState({
        project_name: initialProject?.project_name || '',
        project_desc: initialProject?.project_desc || '',
        department_id: initialProject?.department_id || '',
    })
    const [error, setError] = useState('')

    const handleChange = (e) => {
        const { name, value } = e.target
        setProject(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = () => {
        if (!project.project_name.trim()) {
            setError(t('validation.projectNameRequired', 'Project name is required'))
            return
        }
        if (!project.department_id) {
            setError(t('validation.departmentRequired', 'Department is required'))
            return
        }
        setError('')
        setProject(initialProject)  
        onSave(project)
    }

    const handleCancel = () => {
        setProject(initialProject);
        setError('');
        onCancel();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 className="text-lg text-grey-600 mb-2">
                {t('projects.add_new', 'Add Project')}
            </h3>
            <InputText
                name="project_name"
                value={project.project_name}
                onChange={handleChange}
                placeholder={t('projects.name')}
                className={error && !project.project_name ? 'p-invalid' : ''}
            />
            <InputText
                name="project_desc"
                value={project.project_desc}
                onChange={handleChange}
                placeholder={t('projects.description')}
            />
            <Dropdown
                name="department_id"
                value={project.department_id}
                options={departments}
                onChange={handleChange}
                placeholder={t('projects.select_department')}
                optionLabel="label"
                optionValue="value"
                className={error && !project.department_id ? 'p-invalid' : ''}
            />
        
            {error && <small style={{ color: 'red' }}>{error}</small>}
            <div style={{ display: 'flex', gap: 8 }}>
                <Button label={initialProject ? t('common.update', 'Update') : t('common.add', 'Add')} onClick={handleSave} />
                <Button label={t('common.cancel')} className="p-button-secondary" onClick={handleCancel} />
            </div>
        </div>
    )
}
