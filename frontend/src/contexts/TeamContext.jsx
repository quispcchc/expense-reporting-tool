import { createContext, useContext, useReducer } from 'react'
import { mockTeams } from '../utils/mockData.js'

const TeamContext = createContext()
const TeamDispatchContext = createContext()

const initialState = [...mockTeams]

const teamReducer = (state, action) => {
    switch (action.type) {
        case 'create':
            return [...state, action.payload]

        case 'update':
            return state.map(team =>
                team.code === action.payload.code ? { ...team, ...action.payload } : team,
            )

        default:
            return state
    }
}

export const TeamProvider = ({ children }) => {
    const [state, dispatch] = useReducer(teamReducer, initialState)

    return <TeamContext.Provider value={ state }>
        <TeamDispatchContext.Provider value={ dispatch }>
            { children }
        </TeamDispatchContext.Provider>

    </TeamContext.Provider>

}

export const useTeam = () => {
    return useContext(TeamContext)
}
export const useTeamDispatch = () => {
    return useContext(TeamDispatchContext)
}