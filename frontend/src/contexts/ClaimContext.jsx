import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import api from '../api/api.js'

const ClaimContext = createContext()

const CLAIM_ACTIONS = {
    SET_CLAIMS: 'SET_CLAIMS',
    SET_MY_CLAIMS: 'SET_MY_CLAIMS',
    CREATE_CLAIM: 'CREATE_CLAIM',
    UPDATE_CLAIM: 'UPDATE_CLAIM',
    DELETE_CLAIM: 'DELETE_CLAIM',
}

// Reducer function to handle claim state updates based on dispatched actions
const claimReducer = (state, action) => {
    switch (action.type) {
        // Add new claim to existing claims array
        case CLAIM_ACTIONS.SET_CLAIMS:
            return {
                ...state,
                claims: action.payload,
                hasFetchedClaims: true,
            }
        case CLAIM_ACTIONS.SET_MY_CLAIMS:
            return {
                ...state,
                myClaims: action.payload,
                hasFetchedMyClaims: true,
            }
        case CLAIM_ACTIONS.CREATE_CLAIM:
            return {
                ...state,
                claims: [...state.claims, action.payload],
            }

        // Update the matching claim by claimId
        case CLAIM_ACTIONS.UPDATE_CLAIM:
            return {
                ...state,
                claims: state.claims.map(claim =>
                    claim.claim_id === action.payload.claim_id ? action.payload : claim,
                ),
            }

        // Remove claim with the given claimId
        case CLAIM_ACTIONS.DELETE_CLAIM:
            return {
                ...state,
                claims: state.claims.filter(claim =>
                    claim.claim_id !== action.payload.claim_id,
                ),
            }
    }
}

export function ClaimProvider({ children }) {
    const [state, dispatch] = useReducer(claimReducer, {
        claims: [],
        myClaims: [],
        hasFetchedClaims: false,
        hasFetchedMyClaims: false,
    })

    const isFetchingClaims = useRef(false)
    const isFetchingMyClaims = useRef(false)

    // Action creators to dispatch actions to the reducer
    const actions = {
        // Fetch existing claims from database
        fetchClaims: async (force = false) => {
            if (!force && (state.hasFetchedClaims || isFetchingClaims.current)) {
                return
            }
            try {
                isFetchingClaims.current = true
                const response = await api.get('/claims')
                console.log('fetch claims', response)
                dispatch({
                    type: CLAIM_ACTIONS.SET_CLAIMS,
                    payload: response.data,
                })
            } catch (error) {
                console.error("Error fetching claims:", error)
            } finally {
                isFetchingClaims.current = false
            }
        },

        // Fetch current user's claims from database
        fetchMyClaims: async (force = false) => {
            if (!force && (state.hasFetchedMyClaims || isFetchingMyClaims.current)) {
                return
            }
            try {
                isFetchingMyClaims.current = true
                const response = await api.get('/my-claims')
                console.log('fetch my claims', response)
                dispatch({
                    type: CLAIM_ACTIONS.SET_MY_CLAIMS,
                    payload: response.data,
                })
            } catch (error) {
                console.error("Error fetching my claims:", error)
            } finally {
                isFetchingMyClaims.current = false
            }
        },

        createClaim: async (claim) => {
            try {
                const response = await api.post('claims', claim)
                console.log(response)

                // Add to local state for UI display
                dispatch({
                    type: CLAIM_ACTIONS.CREATE_CLAIM,
                    payload: response.data,
                })
            }
            catch (error) {
                console.error('Error creating claim:', error.response?.data || error.message)
                throw error
            }
        },

        // Add updated timestamp and dispatch update action
        updateClaim: (updatedClaim) => {
            const formattedUpdatedClaim = {
                ...updatedClaim,
                updatedAt: new Date().toISOString().split('T')[0],
            }

            dispatch({ type: CLAIM_ACTIONS.UPDATE_CLAIM, payload: formattedUpdatedClaim })
        },

        // Dispatch delete action with claimId
        deleteClaimById: (claimId) => {
            dispatch({ type: CLAIM_ACTIONS.DELETE_CLAIM, payload: claimId })
        },

        // Helper function to find a claim by ID
        getClaimById: async (claimId) => {
            const response = await api.get(`claims/${claimId}`)
            console.log('fetch single claim', response.data)
            return response.data
        },

        refreshClaims: () => {
            actions.fetchClaims(true)
        },

        refreshMyClaims: () => {
            actions.fetchMyClaims(true)
        }

    }

    const value = {
        claims: state.claims,
        myClaims: state.myClaims,
        hasFetchedClaims: state.hasFetchedClaims,
        hasFetchedMyClaims: state.hasFetchedMyClaims,
        ...actions,
    }

    return (
        <ClaimContext.Provider value={value}>
            {children}
        </ClaimContext.Provider>
    )
}

export const useClaims = () => {
    const context = useContext(ClaimContext)
    if (!context) throw new Error('useClaims must be used within UserProvider')
    return context
}