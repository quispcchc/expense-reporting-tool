import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/api.js'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null)
    const [token, setToken] = useState(null)
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // On component mount, initialize auth state from sessionStorage
    useEffect(() => {
        const initializeAuth = () => {
            const storedToken = sessionStorage.getItem('token')
            const storedUser = sessionStorage.getItem('authUser')

            if (storedToken && storedUser) {
                setToken(storedToken)
                setAuthUser(JSON.parse(storedUser))
            }
            setIsLoading(false)
        }
        initializeAuth()
    }, [])

    const actions = {
        // Login function - sends credentials, receives token and user info
        login: async(credentials) => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await api.post('/login', credentials)
                const { access_token, user } = response.data

                console.log(response)

                // Update auth state and persist to sessionStorage
                setAuthUser(user)
                setToken(access_token)
                sessionStorage.setItem('token', access_token)
                sessionStorage.setItem('authUser', JSON.stringify(user))

                return { success: true, redirectTo: user.role_name === 'regular_user' ? '/user' : '/admin', user: user }
            }
            catch (err) {
                const errorMessage = err.message || 'Login failed. Please try again.'
                setError(errorMessage)
                console.log('Error occurred while login', err)
                return { success: false }

            } finally {
                setIsLoading(false)
            }
        },

        // Logout function - calls API and clears auth state & sessionStorage
        logout: async() => {
            setIsLoading(true)
            try {
                const response = await api.post('/logout')
                setAuthUser(null)
                setToken(null)
                setError(null)
                sessionStorage.removeItem('authUser')
                sessionStorage.removeItem('token')
                console.log(response)
                return { success: true, message: 'Log out successfully!' }
            }
            catch (err) {
                console.error('Logout error:', err)
                return { success: false, error: 'Logout failed' }
            } finally {
                setIsLoading(false)
            }
        },

        // Request password reset
        forgetPassword: async(email) => {
            setError(null)
            setIsLoading(true)
            try {
                const response = await api.post('/forget-password', { email })
                return { success: true, ...response.data }
            }
            catch (error) {
                const message = error.message || 'Something went wrong.'
                setError(message)
                return { success: false, message }
            } finally {
                setIsLoading(false)
            }
        },

        // Reset password
        resetPassword: async(info)=>{
            const response = await api.post('/reset-password', info)
            console.log(response)


        },

        // Update password
        updatePassword: async(password) => {
            setError(null)
            setIsLoading(true)
            try {
                const response = await api.put('/update-password', password)
                const message = response.data
                return { success: true, message }
            }
            catch (error) {
                const message = error.message || 'Something went wrong.'
                setError(message)
                return { success: false, message }
            } finally {
                setIsLoading(false)
            }
        },

        // Helper function to check if user is authenticated by checking state or sessionStorage
        isAuthenticated: () => {
            return !!( token && authUser ) ||
                !!( sessionStorage.getItem('token') && sessionStorage.getItem('authUser') )
        }
    }

    // Context value with all auth-related state and methods to expose to consumers
    const value = {
        token, authUser, isLoading, error, setError,
        ...actions
    }

    return (
        <AuthContext.Provider value={ value }>
            { children }
        </AuthContext.Provider>
    )
}

// Custom hook to use the AuthContext, throws error if used outside AuthProvider
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}



