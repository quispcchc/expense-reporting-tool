import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import api from '../api/api.js'

const AccountNumberContext = createContext()
const AccountNumberDispatchContext = createContext()

// Initial state
const initialState = {
    accountNumbers: [],
    loading: false,
    error: null,
    hasFetched: false,
}

function accountNumberReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: true, error: null }
        case 'SET_INITIAL_DATA':
            return { ...state, loading: false, accountNumbers: action.payload, hasFetched: true }
        case 'SET_ERROR':
            return { ...state, loading: false, error: action.payload }
        case 'CREATE_ACCOUNT_NUMBER':
            return { ...state, loading: false, accountNumbers: [...state.accountNumbers, action.payload] }
        case 'UPDATE_ACCOUNT_NUMBER':
            return {
                ...state,
                loading: false,
                accountNumbers: state.accountNumbers.map(an =>
                    an.account_number_id === action.payload.account_number_id ? action.payload : an,
                ),
            }
        case 'DELETE_ACCOUNT_NUMBER':
            return {
                ...state,
                loading: false,
                accountNumbers: state.accountNumbers.filter(an => an.account_number_id !== action.payload),
            }
        case 'RESET_FETCH_STATE':
            return { ...state, hasFetched: false }
        default:
            return state
    }
}

export const AccountNumberProvider = ({ children }) => {
    const [state, dispatch] = useReducer(accountNumberReducer, initialState)
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
                const { data } = await api.get('/account-numbers')
                dispatch({ type: 'SET_INITIAL_DATA', payload: data })
            }
            catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
            }
            finally {
                isFetching.current = false
            }
        }

        fetchData()
    }, [state.hasFetched])

    const actions = {
        createAccountNumber: async (accountNumber) => {
            dispatch({ type: 'SET_LOADING' })
            const newAccountNumber = {
                account_number: accountNumber.accountNumber,
                description: accountNumber.description,
            }
            try {
                const response = await api.post('account-numbers', newAccountNumber)
                dispatch({ type: 'CREATE_ACCOUNT_NUMBER', payload: response.data })
                return { success: true, data: response.data }
            }
            catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
                return { success: false, error: err.message }
            }
        },

        updateAccountNumber: async (newData) => {
            dispatch({ type: 'SET_LOADING' })

            const updatedAccountNumber = {
                account_number: newData.account_number,
                description: newData.description,
            }

            try {
                const response = await api.put(`account-numbers/${newData.account_number_id}`, updatedAccountNumber)
                dispatch({ type: 'UPDATE_ACCOUNT_NUMBER', payload: response.data })
                return { success: true, data: response.data }
            }
            catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
                return { success: false, error: err.message }
            }
        },

        deleteAccountNumber: async (accountNumberId) => {
            dispatch({ type: 'SET_LOADING' })
            try {
                await api.delete(`account-numbers/${accountNumberId}`)
                dispatch({ type: 'DELETE_ACCOUNT_NUMBER', payload: accountNumberId })
                return { success: true }
            } catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
                return { success: false, error: err.message }
            }
        },

        // Force refresh data from server
        refreshAccountNumbers: () => {
            dispatch({ type: 'RESET_FETCH_STATE' })
        }
    }

    return <AccountNumberContext.Provider value={{ state, actions }}>
        <AccountNumberDispatchContext.Provider value={dispatch}>
            {children}
        </AccountNumberDispatchContext.Provider>
    </AccountNumberContext.Provider>
}

export const useAccountNumber = () => {
    return useContext(AccountNumberContext)
}

export const useAccountNumberDispatch = () => {
    return useContext(AccountNumberDispatchContext)
}
