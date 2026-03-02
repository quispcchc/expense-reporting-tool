import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import api from '../api/api.js'

const UserContext = createContext()
const UserDispatchContext = createContext()

const initialState = {
    users: [],
    loading: false,
    error: null,
    hasFetched: false,
}

const userReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: true, error: null }

        case 'SET_USERS':
            return { ...state, loading: false, users: action.payload || [], hasFetched: true }

        case 'SET_ERROR':
            return { ...state, loading: false, error: action.payload }

        case 'CREATE_USER':
            return { ...state, loading: false, users: [...state.users, action.payload] }

        case 'UPDATE_USER':
            return {
                ...state,
                loading: false,
                users: state.users.map(user =>
                    user.user_id === action.payload.user_id ? { ...user, ...action.payload } : user,
                ),
            }

        case 'DELETE_USER':
            return {
                ...state,
                loading: false,
                users: state.users.filter(u => u.user_id !== action.payload),
            }

        case 'RESET_FETCH_STATE':
            return { ...state, hasFetched: false }

        default:
            return state
    }
}

export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userReducer, initialState)
    const isFetching = useRef(false)

    // Fetch users from backend
    const getUsers = async (force = false) => {
        // Prevent duplicate calls unless forced
        if (!force && (state.hasFetched || isFetching.current)) {
            return
        }

        isFetching.current = true
        dispatch({ type: 'SET_LOADING' })

        try {
            const res = await api.get('/admin/users')
            dispatch({ type: 'SET_USERS', payload: res.data })
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message })
        } finally {
            isFetching.current = false
        }
    }

    useEffect(() => {
        if (!state.hasFetched) {
            getUsers()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.hasFetched])

    // Actions exposed to components
    const createUser = async (userData) => {
        dispatch({ type: 'SET_LOADING' })
        try {
            const res = await api.post('/admin/create-user', userData)
            dispatch({ type: 'CREATE_USER', payload: res.data.user })
            return { success: true, data: res.data.user }
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message })
            return { success: false, error: err.message }
        }
    }

    const updateUser = async (userData) => {
        dispatch({ type: 'SET_LOADING' })
        try {
            const res = await api.put(`/admin/users/${userData.user_id}`, userData)
            dispatch({ type: 'UPDATE_USER', payload: res.data || userData })
            return { success: true, data: res.data }
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message })
            return { success: false, error: err.message }
        }
    }

    const deleteUser = async (userId) => {
        dispatch({ type: 'SET_LOADING' })
        try {
            await api.delete(`/admin/users/${userId}`)
            dispatch({ type: 'DELETE_USER', payload: userId })
            return { success: true }
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.message })
            return { success: false, error: err.message }
        }
    }

    const refreshUsers = () => {
        dispatch({ type: 'RESET_FETCH_STATE' })
    }

    return (
        <UserContext.Provider value={state}>
            <UserDispatchContext.Provider value={{ createUser, updateUser, deleteUser, refresh: refreshUsers }}>
                {children}
            </UserDispatchContext.Provider>
        </UserContext.Provider>
    )
}

export const useUser = () => {
    return useContext(UserContext)
}

export const useUserDispatch = () => {
    return useContext(UserDispatchContext)
}