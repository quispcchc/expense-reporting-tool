import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'

const LoadingContext = createContext()

export const LoadingProvider = ({ children }) => {
    const [activeRequests, setActiveRequests] = useState(0)

    const showLoader = useCallback(() => {
        setActiveRequests(prev => prev + 1)
    }, [])

    const hideLoader = useCallback(() => {
        setActiveRequests(prev => Math.max(0, prev - 1))
    }, [])

    const value = useMemo(() => ({
        isLoading: activeRequests > 0,
        showLoader,
        hideLoader
    }), [activeRequests, showLoader, hideLoader])

    return (
        <LoadingContext.Provider value={value}>
            {children}
        </LoadingContext.Provider>
    )
}

export const useLoading = () => {
    const context = useContext(LoadingContext)
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider')
    }
    return context
}
