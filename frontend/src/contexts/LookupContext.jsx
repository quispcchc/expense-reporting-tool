import { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
    const [retryCount, setRetryCount] = useState(0)

    const fetchLookups = useCallback(async () => {
        try {
            setError(null)

            // Require auth token before fetching
            // Use AuthContext to check authentication status
            if (!isAuthenticated()) {
                // If not authenticated, we shouldn't necessarily error out loudly, just don't fetch
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
                setRetryCount(0) // Reset retry count on success
                return true // Indicate success
            } else {
                // Data is empty, might need to retry
                console.warn('LookupContext: Data fetched but seems empty.')
                // setError('No lookup data available') // Don't block UI with error for empty lookups maybe?
                return true // Treated as success but empty
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch lookups')
            console.error('Error fetching lookups:', err)
            return false
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated])

    // Initial fetch with retry logic
    useEffect(() => {
        const maxRetries = 3
        const retryDelay = 2000 // 2 seconds

        const fetchWithRetry = async () => {
            if (!isAuthenticated()) {
                setLoading(false)
                return
            }

            const success = await fetchLookups()

            if (!success && retryCount < maxRetries) {
                // Only retry if we are still authenticated
                if (isAuthenticated()) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1)
                        setLoading(true)
                    }, retryDelay)
                }
            }
        }

        fetchWithRetry()
    }, [isAuthenticated, retryCount, fetchLookups])

    const value = {
        lookups,
        loading,
        error,
        retryCount,
        refreshLookups: fetchLookups // Expose refresh function for external use
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