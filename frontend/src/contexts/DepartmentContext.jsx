import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import api from '../api/api.js'

const DepartmentContext = createContext()
const DepartmentDispatchContext = createContext()

const initialState = {
    departments: [],
    loading: false,
    error: null,
    hasFetched: false,
}

const departmentReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: true, error: null }
        case 'SET_INITIAL_DATA':
            return { ...state, loading: false, departments: action.payload, hasFetched: true }
        case 'SET_ERROR':
            return { ...state, loading: false, error: action.payload }
        case 'CREATE_DEPARTMENT':
            return { ...state, loading: false, departments: [...state.departments, action.payload] }
        case 'UPDATE_DEPARTMENT':
            return {
                ...state,
                loading: false,
                departments: state.departments.map(dept =>
                    dept.department_id === action.payload.department_id ? action.payload : dept,
                ),
            }
        case 'DELETE_DEPARTMENT':
            return {
                ...state,
                loading: false,
                departments: state.departments.filter(dept => dept.department_id !== action.payload),
            }
        case 'RESET_FETCH_STATE':
            return { ...state, hasFetched: false }
        default:
            return state
    }
}

export const DepartmentProvider = ({ children }) => {
    const [state, dispatch] = useReducer(departmentReducer, initialState)
    const isFetching = useRef(false)

    // Load initial data
    useEffect(() => {
        async function fetchData() {
            // Prevent duplicate calls
            if (state.hasFetched || isFetching.current) {
                return
            }

            isFetching.current = true
            dispatch({ type: 'SET_LOADING' })

            try {
                const response = await api.get('/departments')
                dispatch({ type: 'SET_INITIAL_DATA', payload: response.data })
            } catch (err) {
                console.error('DepartmentContext: Error fetching departments', err)
                dispatch({ type: 'SET_ERROR', payload: err.message })
            } finally {
                isFetching.current = false
            }
        }
        fetchData()
    }, [state.hasFetched])

    const actions = {
        createDepartment: async (departmentData) => {
            dispatch({ type: 'SET_LOADING' })
            try {
                const response = await api.post('/departments', departmentData)
                dispatch({ type: 'CREATE_DEPARTMENT', payload: response.data })
                return { success: true, data: response.data }
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message
                dispatch({ type: 'SET_ERROR', payload: errorMessage })
                return { success: false, error: errorMessage }
            }
        },

        updateDepartment: async (departmentData) => {
            dispatch({ type: 'SET_LOADING' })
            try {
                const response = await api.put(`/departments/${departmentData.department_id}`, departmentData)
                dispatch({ type: 'UPDATE_DEPARTMENT', payload: response.data })
                return { success: true, data: response.data }
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message
                dispatch({ type: 'SET_ERROR', payload: errorMessage })
                return { success: false, error: errorMessage }
            }
        },

        deleteDepartment: async (departmentId) => {
            dispatch({ type: 'SET_LOADING' })
            try {
                await api.delete(`/departments/${departmentId}`)
                dispatch({ type: 'DELETE_DEPARTMENT', payload: departmentId })
                return { success: true }
            } catch (err) {
                const errorMessage = err.response?.data?.message || err.message
                dispatch({ type: 'SET_ERROR', payload: errorMessage })
                return { success: false, error: errorMessage }
            }
        },

        // Force refresh data from server
        refreshDepartments: () => {
            dispatch({ type: 'RESET_FETCH_STATE' })
        },
    }

    return (
        <DepartmentContext.Provider value={{ state, actions }}>
            <DepartmentDispatchContext.Provider value={dispatch}>
                {children}
            </DepartmentDispatchContext.Provider>
        </DepartmentContext.Provider>
    )
}

export const useDepartment = () => {
    return useContext(DepartmentContext)
}

export const useDepartmentDispatch = () => {
    return useContext(DepartmentDispatchContext)
}

