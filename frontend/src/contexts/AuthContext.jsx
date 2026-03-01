import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import api from '../api/api.js'
import { ROLE_NAME } from '../config/constants.js'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null)
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [path, setPath] = useState()

    // On component mount, verify auth with server via HttpOnly cookie
    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = Cookies.get('authUser')

            if (storedUser) {
                try {
                    // The HttpOnly auth_token cookie is sent automatically.
                    // If valid, user is authenticated; if expired/missing, 401.
                    await api.get('/user')
                    setAuthUser(JSON.parse(storedUser))
                } catch (err) {
                    // Only clear session if strictly 401 (Unauthorized)
                    // Network errors or 500s should NOT log the user out immediately
                    if (err.status === 401 || err.response?.status === 401) {
                        Cookies.remove('authUser', { path: '/' })
                        setAuthUser(null)
                    } else {
                        setAuthUser(JSON.parse(storedUser))
                    }
                }
            }
            setIsLoading(false)
        }
        initializeAuth()
    }, [])

    const actions = {
        // Login function - sends credentials to backend which sets HttpOnly auth cookie
        // When remember is true, backend sets a 30-day persistent cookie; otherwise session cookie
        login: async (credentials) => {
            setIsLoading(true)
            setError(null)
            try {
                const response = await api.post('/login', credentials)
                const { user } = response.data

                setAuthUser(user)

                // Store user info in a regular cookie for quick UI access on reload
                // (non-sensitive data — the auth token is in an HttpOnly cookie managed by backend)
                const cookieOptions = credentials.remember ? { expires: 30 } : {}
                Cookies.set('authUser', JSON.stringify(user), cookieOptions)

                const path = user.role_name === ROLE_NAME.USER ? '/user' : '/admin'

                return { success: true, redirectTo: path, user: user }
            }
            catch (err) {
                const errorMessage = err.message || 'Login failed. Please try again.'
                setError(errorMessage)
                return { success: false }

            } finally {
                setIsLoading(false)
            }
        },

        // Logout function - calls API (which clears HttpOnly cookie) and clears local state
        logout: async () => {
            setIsLoading(true)
            try {
                await api.post('/logout')
            }
            catch (err) {
                // Logout errors are non-critical — state is cleared regardless
            } finally {
                // Clear state regardless of server response
                setAuthUser(null)
                setError(null)
                Cookies.remove('authUser', { path: '/' })
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
            setError(null)
            try {
                const response = await api.post('/reset-password', info)
                return { success: true, message: response.data?.message || 'Password reset successfully' }
            } catch (error) {
                const message = error.response?.data?.message || error.message || 'Failed to reset password'
                setError(message)
                return { success: false, message }
            }
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

        // Helper function to check if user is authenticated
        isAuthenticated: () => {
            return !!authUser || !!Cookies.get('authUser')
        }
    }

    // Context value with all auth-related state and methods to expose to consumers
    const value = {
        authUser, isLoading, error, setError, path,
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
