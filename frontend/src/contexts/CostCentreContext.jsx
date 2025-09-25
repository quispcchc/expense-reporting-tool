import { createContext, useContext, useEffect, useReducer } from 'react'
import api from '../api/api.js'

const CostCentreContext = createContext()
const CostCentreDispatchContext = createContext()

// Initial state
const initialState = {
    costCentres: [],
    loading: false,
    error: null,
}

function costCentreReducer (state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: true, error: null }
        case 'SET_INITIAL_DATA':
            return { ...state, loading: false, costCentres: action.payload }
        case 'SET_ERROR':
            return { ...state, loading: false, error: action.payload }
        case 'CREATE_COST_CENTRE':
            return { ...state, loading: false, costCentres: [...state.costCentres, action.payload] }
        case 'UPDATE_COST_CENTRE':
            return {
                ...state,
                loading: false,
                costCentres: state.costCentres.map(cc =>
                    cc.cost_centre_id === action.payload.cost_centre_id ? action.payload : cc,
                ),
            }
        case 'DELETE_COST_CENTRE':
            return {
                ...state,
                loading: false,
                costCentres: state.costCentres.filter(cc => cc.cost_centre_id !== action.payload),
            }
        default:
            return state
    }
}

export const CostCentreProvider = ({ children }) => {
    const [state, dispatch] = useReducer(costCentreReducer, initialState)

    // Load initial data
    useEffect(() => {
        async function fetchData () {
            dispatch({ type: 'SET_LOADING' })
            try {
                const { data } = await api.get('/cost-centres')
                dispatch({ type: 'SET_INITIAL_DATA', payload: data.data })
            }
            catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
            }
        }

        fetchData()
    }, [])

    const actions = {
        createCostCentre: async(costCentre) => {
            dispatch({ type: 'SET_LOADING' })
            const newCostCentre = {
                team_id: costCentre.area,
                cost_centre_code: costCentre.code,
                active_status_id: costCentre.status,
                description: costCentre.description,
            }
            try {
                const { data } = await api.post('cost-centres', newCostCentre)
                dispatch({ type: 'CREATE_COST_CENTRE', payload: data.data })
                return data
            }
            catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
            }

        },

        updateCostCentre: async(newData) => {
            dispatch({ type: 'SET_LOADING' })

            const updatedCostCentre = {
                team_id: newData.team_id,
                cost_centre_code: newData.cost_centre_code,
                active_status_id: newData.active_status_id,
                description: newData.description,
            }

            try {
                const { data } = await api.put(`cost-centres/${ newData.cost_centre_id }`, updatedCostCentre)
                dispatch({ type: 'UPDATE_COST_CENTRE', payload: data.data })
                return data
            }
            catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
            }

        },

        deleteCostCentre:async(costCentreId)=>{
            dispatch({ type: 'SET_LOADING' })
            try {
                const response = await api.delete(`cost-centres/${costCentreId}`)
                dispatch({ type: 'DELETE_COST_CENTRE', payload: costCentreId })
                return response

            }catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message})
            }
        }
    }

    return <CostCentreContext.Provider value={ { state, actions } }>
        <CostCentreDispatchContext.Provider value={ dispatch }>
            { children }
        </CostCentreDispatchContext.Provider>

    </CostCentreContext.Provider>

}

export const useCostCentre = () => {
    return useContext(CostCentreContext)
}
export const useCostCentreDispatch = () => {
    return useContext(CostCentreDispatchContext)
}