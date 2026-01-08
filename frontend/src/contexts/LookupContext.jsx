import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api from '../api/api.js'

const LookupContext = createContext()

export function LookupProvider({ children }) {
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
        claimStatus: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [retryCount, setRetryCount] = useState(0)

    const fetchLookups = useCallback(async () => {
        try {
            setError(null)

            // Require auth token before fetching
            const token = sessionStorage.getItem('token')
            if (!token) {
                setError('Not authenticated')
                return false
            }

            const { data } = await api.get('lookups')

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
                    claimStatus: data.claimStatus || []
                })
                setRetryCount(0) // Reset retry count on success
                return true // Indicate success
            } else {
                // Data is empty, might need to retry
                setError('No lookup data available')
                return false
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch lookups')
            console.error('Error fetching lookups:', err)
            return false
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial fetch with retry logic
    useEffect(() => {
        const maxRetries = 3
        const retryDelay = 2000 // 2 seconds

        const fetchWithRetry = async () => {
            const hasToken = sessionStorage.getItem('token')
            if (!hasToken) {
                setLoading(false)
                return
            }

            const success = await fetchLookups()

            if (!success && retryCount < maxRetries) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1)
                    setLoading(true)
                }, retryDelay)
            }
        }

        fetchWithRetry()
    }, [retryCount, fetchLookups])

    const value = {
        lookups,
        loading,
        error,
        retryCount
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