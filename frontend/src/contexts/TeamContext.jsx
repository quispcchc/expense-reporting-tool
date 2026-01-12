import { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../api/api.js'

const TeamContext = createContext()
const TeamDispatchContext = createContext()

const initialState = {
    teams: [],
    loading: false,
    error: null,
}

const teamReducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: true, error: null }
        case 'SET_INITIAL_DATA':
            return { ...state, loading: false, teams: action.payload }
        case 'SET_ERROR':
            return { ...state, loading: false, error: action.payload }
        case 'CREATE_TEAM':
            return { ...state, loading: false, teams: [...state.teams, action.payload] }
        case 'UPDATE_TEAM':
            return {
                ...state,
                loading: false,
                teams: state.teams.map(team =>
                    team.team_id === action.payload.team_id ? action.payload : team,
                ),
            }
        case 'DELETE_TEAM':
            return {
                ...state,
                loading: false,
                teams: state.teams.filter(team => team.team_id !== action.payload),
            }
        default:
            return state
    }
}

export const TeamProvider = ({ children }) => {
    const [state, dispatch] = useReducer(teamReducer, initialState)

    // Load initial data
    useEffect(() => {
        async function fetchData() {
            dispatch({ type: 'SET_LOADING' })
            try {
                const { data } = await api.get('/teams')
                dispatch({ type: 'SET_INITIAL_DATA', payload: data })
            } catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
            }
        }
        fetchData()
    }, [])

    const actions = {
        createTeam: async (teamData) => {
            dispatch({ type: 'SET_LOADING' })
            try {
                const { data } = await api.post('/teams', teamData)
                dispatch({ type: 'CREATE_TEAM', payload: data })
                return { success: true, data }
            } catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
                return { success: false, error: err.message }
            }
        },

        updateTeam: async (teamData) => {
            dispatch({ type: 'SET_LOADING' })
            try {
                const { data } = await api.put(`/teams/${teamData.team_id}`, teamData)
                dispatch({ type: 'UPDATE_TEAM', payload: data })
                return { success: true, data }
            } catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
                return { success: false, error: err.message }
            }
        },

        deleteTeam: async (teamId) => {
            dispatch({ type: 'SET_LOADING' })
            try {
                await api.delete(`/teams/${teamId}`)
                dispatch({ type: 'DELETE_TEAM', payload: teamId })
                return { success: true }
            } catch (err) {
                dispatch({ type: 'SET_ERROR', payload: err.message })
                return { success: false, error: err.message }
            }
        },
    }

    return (
        <TeamContext.Provider value={{ state, actions }}>
            <TeamDispatchContext.Provider value={dispatch}>
                {children}
            </TeamDispatchContext.Provider>
        </TeamContext.Provider>
    )
}

export const useTeam = () => {
    return useContext(TeamContext)
}

export const useTeamDispatch = () => {
    return useContext(TeamDispatchContext)
}