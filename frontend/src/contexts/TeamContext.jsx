import { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../api/api.js'

const TeamContext = createContext()
const TeamDispatchContext = createContext()

const initialState = []

const teamReducer = (state, action) => {
    switch (action.type) {
        case 'set':
            return action.payload || []

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

    // Fetch teams from backend on mount
    const getTeams = async () => {
        try {
            const res = await api.get('/lookups')
            dispatch({ type: 'set', payload: res.data.teams || [] })
        } catch (err) {
            console.error('Failed to fetch teams', err)
        }
    }

    useEffect(() => {
        getTeams()
    }, [])

    return <TeamContext.Provider value={state}>
        <TeamDispatchContext.Provider value={dispatch}>
            {children}
        </TeamDispatchContext.Provider>

    </TeamContext.Provider>

}

export const useTeam = () => {
    return useContext(TeamContext)
}
export const useTeamDispatch = () => {
    return useContext(TeamDispatchContext)
}