import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import api from '../api/api.js'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null)
    const [token, setToken] = useState(null)
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [path, setPath] = useState()

    // On component mount, initialize auth state from Cookies and verify with server
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = Cookies.get('token')
            const storedUser = Cookies.get('authUser')

            if (storedToken && storedUser) {
                try {
                    // Verify token with server
                    // We need to manually set the header here because the interceptor might not pick up the cookie yet if api.js is not updated/reloaded context
                    // But api.js reads from storage on every request, so we just need to ensure we use valid logic there too.
                    // For now, let's just attempt to fetch user.
                    await api.get('/user')

                    setToken(storedToken)
                    setAuthUser(JSON.parse(storedUser))
                } catch (err) {
                    console.log('Session check failed:', err)
                    // Only clear session if strictly 401 (Unauthorized)
                    // Network errors or 500s should NOT log the user out immediately
                    if (err.status === 401 || err.response?.status === 401) {
                        console.log('Session expired (401), logging out.');
                        Cookies.remove('token', { path: '/' })
                        Cookies.remove('authUser', { path: '/' })
                        setAuthUser(null)
                        setToken(null)
                    } else {
                        console.warn('Server validation failed but not 401. Keeping local session for now.');
                        // We keep the local state. If the token is truly invalid, the next API call will trigger the 401 interceptor in api.js
                        setToken(storedToken)
                        setAuthUser(JSON.parse(storedUser))
                    }
                }
            }
            setIsLoading(false)
        }
        initializeAuth()
    }, [])

    const actions = {
        // Login function - sends credentials, receives token and user info
        login: async (credentials) => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await api.post('/login', credentials)
                // Use access_token from response and alias it to token
                const { access_token: token, user } = response.data.data

                console.log(response)

                // Update auth state and persist to Cookies
                // No expires option means it's a session cookie (removed on browser close)
                setAuthUser(user)
                setToken(token)
                Cookies.set('token', token)
                Cookies.set('authUser', JSON.stringify(user))

                const path = user.role_name === 'regular_user' ? '/user' : '/admin'

                return { success: true, redirectTo: path, user: user }
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

        // Logout function - calls API and clears auth state & Cookies
        logout: async () => {
            setIsLoading(true)
            try {
                await api.post('/logout')
            }
            catch (err) {
                console.error('Logout error:', err)
            } finally {
                // Clear state regardless of server response
                setAuthUser(null)
                setToken(null)
                setError(null)
                Cookies.remove('authUser')
                Cookies.remove('token')
                setIsLoading(false)
                return { success: true, message: 'Log out successfully!' }
            }
        },

        // Request password reset
        forgetPassword: async (email) => {
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
        resetPassword: async (info) => {
            const response = await api.post('/reset-password', info)
            console.log(response)


        },

        // Update password
        updatePassword: async (password) => {
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

        // Helper function to check if user is authenticated by checking state or Cookies
        isAuthenticated: () => {
            return !!(token && authUser) ||
                !!(Cookies.get('token') && Cookies.get('authUser'))
        }
    }

    // Context value with all auth-related state and methods to expose to consumers
    const value = {
        token, authUser, isLoading, error, setError, path,
        ...actions
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook to use the AuthContext, throws error if used outside AuthProvider
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}
