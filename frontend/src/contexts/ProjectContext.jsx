import { createContext, useContext, useState, useCallback, useRef } from 'react'
import api from '../api/api.js'

const ProjectContext = createContext()

export function ProjectProvider({ children }) {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasFetched, setHasFetched] = useState(false)
    const isFetching = useRef(false)

    const fetchProjects = useCallback(async (force = false) => {
        // Prevent duplicate calls unless forced
        if (!force && (hasFetched || isFetching.current)) {
            return
        }

        isFetching.current = true
        setLoading(true)
        setError(null)
        try {
            const response = await api.get('projects')
            setProjects(response.data)
            setHasFetched(true)
        } catch (err) {
            setError(err.message || 'Failed to fetch projects')
        } finally {
            isFetching.current = false
            setLoading(false)
        }
    }, [hasFetched])

    const createProject = async (projectData) => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.post('projects', projectData)
            setProjects(prev => [...prev, response.data])
            return { success: true, data: response.data }
        } catch (err) {
            const errorMsg = err.message || 'Failed to create project'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        } finally {
            setLoading(false)
        }
    }

    const updateProject = async (project_id, projectData) => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.put(`projects/${project_id}`, projectData)
            setProjects(prev => prev.map(p => p.project_id === project_id ? response.data : p))
            return { success: true, data: response.data }
        } catch (err) {
            const errorMsg = err.message || 'Failed to update project'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        } finally {
            setLoading(false)
        }
    }

    const deleteProject = async (project_id) => {
        setLoading(true)
        setError(null)
        try {
            await api.delete(`projects/${project_id}`)
            setProjects(prev => prev.filter(p => p.project_id !== project_id))
            return { success: true }
        } catch (err) {
            const errorMsg = err.message || 'Failed to delete project'
            setError(errorMsg)
            return { success: false, error: errorMsg }
        } finally {
            setLoading(false)
        }
    }

    const refreshProjects = useCallback(() => {
        setHasFetched(false)
        return fetchProjects(true)
    }, [fetchProjects])

    return (
        <ProjectContext.Provider value={{
            projects,
            loading,
            error,
            hasFetched,
            fetchProjects,
            createProject,
            updateProject,
            deleteProject,
            refreshProjects
        }}>
            {children}
        </ProjectContext.Provider>
    )
}

export const useProjects = () => {
    const context = useContext(ProjectContext)
    if (!context) throw new Error('useProjects must be used within a ProjectProvider')
    return context
}
