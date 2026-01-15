import { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../api/api.js'

const UserContext = createContext()
const UserDispatchContext = createContext()

const initialState = []

const userReducer = (state, action) => {
    switch (action.type) {
        case 'set':
            return action.payload || []

        case 'create':
            return [...state, action.payload]

        case 'update':
            return state.map(user =>
                user.user_id === action.payload.user_id ? { ...user, ...action.payload } : user,
            )

        case 'delete':
            return state.filter(u => u.user_id !== action.payload)

        default:
            return state
    }
}

export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userReducer, initialState)

    // Fetch users from backend on mount
    const getUsers = async () => {
        try {
            const res = await api.get('/admin/users')
            console.log('users',res.data);
            
            dispatch({ type: 'set', payload: res.data })
        } catch (err) {
            console.error('Failed to fetch users', err)
        }
    }

    useEffect(() => {
        getUsers()
    }, [])

    // Actions exposed to components
    const createUser = async (userData) => {
        try {
            // existing backend route for admin create
            await api.post('/admin/create-user', userData)
            // refresh list after creation
            await getUsers()
        } catch (err) {
            throw err
        }
    }

    const updateUser = async (userData) => {
        try {
            await api.put(`/admin/users/${ userData.user_id }`, userData)
            dispatch({ type: 'update', payload: userData })
        } catch (err) {
            throw err
        }
    }

    const deleteUser = async (userId) => {
        try {
            await api.delete(`/admin/users/${ userId }`)
            dispatch({ type: 'delete', payload: userId })
        } catch (err) {
            throw err
        }
    }

    return (
        <UserContext.Provider value={ state }>
            <UserDispatchContext.Provider value={{ createUser, updateUser, deleteUser, refresh: getUsers }}>
                { children }
            </UserDispatchContext.Provider>
        </UserContext.Provider>
    )
}

export const useUser = ()=> {
    return useContext(UserContext)
}
export const useUserDispatch = ()=> {
    return useContext(UserDispatchContext)
}