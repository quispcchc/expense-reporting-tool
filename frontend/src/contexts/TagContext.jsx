import { createContext, useContext, useState, useCallback, useRef } from 'react'
import api from '../api/api.js'

const TagContext = createContext()

export function TagProvider({ children }) {
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [hasFetched, setHasFetched] = useState(false)
    const isFetching = useRef(false)

    const fetchTags = useCallback(async (force = false) => {
        // Prevent duplicate calls unless forced
        if (!force && (hasFetched || isFetching.current)) {
            return
        }

        isFetching.current = true
        setLoading(true)
        setError(null)
        try {
            const response = await api.get('tags')
            setTags(response.data)
            setHasFetched(true)
        } catch (err) {
            setError(err.message || 'Failed to fetch tags')
        } finally {
            isFetching.current = false
            setLoading(false)
        }
    }, [hasFetched])

    const createTag = async (tag_name) => {
        setLoading(true)
        setError(null)
        try {
            const response = await api.post('tags', { tag_name })
            setTags(prev => [...prev, response.data])
            return response.data
        } catch (err) {
            setError(err.message || 'Failed to create tag')
            throw err
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
            throw err
        } finally {
            setLoading(false)
        }
    }

    const refreshTags = useCallback(() => {
        setHasFetched(false)
        return fetchTags(true)
    }, [fetchTags])

    return (
        <TagContext.Provider value={{
            tags,
            loading,
            error,
            hasFetched,
            fetchTags,
            createTag,
            updateTag,
            deleteTag,
            refreshTags
        }}>
            {children}
        </TagContext.Provider>
    )
}

export const useTags = () => {
    const context = useContext(TagContext)
    if (!context) throw new Error('useTags must be used within a TagProvider')
    return context
}
