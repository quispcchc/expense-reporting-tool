import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import api from '../api/api.js'
import { useAuth } from './AuthContext.jsx'

const LookupContext = createContext()

export function LookupProvider({ children }) {
    const { isAuthenticated } = useAuth()
    const [lookups, setLookups] = useState({
        roles: [],
        teams: [],
        positions: [],
        activeStatuses: [],
        departments: [],
        costCentres: [],
        projects: [],
        accountNums: [],
        claimTypes: [],
        claimStatus: [],
        tags: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [hasFetched, setHasFetched] = useState(false)
    const isFetching = useRef(false)

    const fetchLookups = useCallback(async (force = false) => {
        // Prevent duplicate calls unless forced (for refresh)
        if (!force && (hasFetched || isFetching.current)) {
            return true
        }

        try {
            isFetching.current = true
            setError(null)

            // Require auth token before fetching
            if (!isAuthenticated()) {
                console.log('LookupContext: Not authenticated, skipping fetch.')
                return false
            }

            const response = await api.get('lookups')
            const data = response.data

            // Check if data is actually available
            const hasData = data && Object.keys(data).some(key =>
                Array.isArray(data[key]) && data[key].length > 0
            )

            if (hasData) {
                setLookups({
                    roles: data.roles || [],
                    teams: data.teams || [],
                    activeStatuses: data.activeStatuses || [],
                    positions: data.positions || [],
                    departments: data.departments || [],
                    costCentres: data.costCentres || [],
                    projects: data.projects || [],
                    accountNums: data.accountNums || [],
                    claimTypes: data.claimTypes || [],
                    claimStatus: data.claimStatus || [],
                    tags: data.tags || []
                })
                setHasFetched(true)
                return true
            } else {
                console.warn('LookupContext: Data fetched but seems empty.')
                setHasFetched(true)
                return true
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch lookups')
            console.error('Error fetching lookups:', err)
            return false
        } finally {
            isFetching.current = false
            setLoading(false)
        }
    }, [isAuthenticated, hasFetched])

    // Initial fetch
    useEffect(() => {
        if (!hasFetched && isAuthenticated()) {
            fetchLookups()
        } else if (!isAuthenticated()) {
            setLoading(false)
        }
    }, [isAuthenticated, hasFetched, fetchLookups])

    // Refresh function that forces a new fetch
    const refreshLookups = useCallback(async () => {
        setHasFetched(false)
        return fetchLookups(true)
    }, [fetchLookups])

    const value = {
        lookups,
        loading,
        error,
        refreshLookups
    }

    return (
        <LookupContext.Provider value={value}>
            {children}
        </LookupContext.Provider>
    )
}

export const useLookups = () => {
    const context = useContext(LookupContext)
    if (!context) {
        throw new Error('useLookups must be used within a LookupProvider')
    }
    return context
}