import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/api.js'

const TagContext = createContext()

export function TagProvider({ children }) {
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchTags = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.get('tags')
            setTags(response.data)
        } catch (err) {
            setError(err.message || 'Failed to fetch tags')
        } finally {
            setLoading(false)
        }
    }, [])

    const createTag = async (tag_name) => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.post('tags', { tag_name })
            setTags(prev => [...prev, response.data])
        } catch (err) {
            setError(err.message || 'Failed to create tag')
        } finally {
            setLoading(false)
        }
    }

    const updateTag = async (tag_id, tag_name) => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.put(`tags/${tag_id}`, { tag_name })
            setTags(prev => prev.map(t => t.tag_id === tag_id ? response.data : t))
        } catch (err) {
            setError(err.message || 'Failed to update tag')
        } finally {
            setLoading(false)
        }
    }

    const deleteTag = async (tag_id) => {
        setLoading(true)
        setError(null)
        try {
            await api.delete(`tags/${tag_id}`)
            setTags(prev => prev.filter(t => t.tag_id !== tag_id))
        } catch (err) {
            setError(err.message || 'Failed to delete tag')
        } finally {
            setLoading(false)
        }
    }

    return (
        <TagContext.Provider value={{ tags, loading, error, fetchTags, createTag, updateTag, deleteTag }}>
            {children}
        </TagContext.Provider>
    )
}

export const useTags = () => {
    const context = useContext(TagContext)
    if (!context) throw new Error('useTags must be used within a TagProvider')
    return context
}
