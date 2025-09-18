import { createContext, useContext, useReducer } from 'react'
import { mockCostCentres } from '../utils/mockData.js'

const CostCentreContext = createContext()
const CostCentreDispatchContext = createContext()

const initialState = [...mockCostCentres]

const costCentreReducer = (state, action) => {
    switch (action.type) {
        case 'create':
            return [...state, action.payload]

        case 'update':
            return state.map(costCentre =>
                costCentre.code === action.payload.code ? { ...costCentre, ...action.payload } : costCentre,
            )

        default:
            return state
    }
}

export const CostCentreProvider = ({ children }) => {
    const [state, dispatch] = useReducer(costCentreReducer, initialState)

    return <CostCentreContext.Provider value={ state }>
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