import { createContext, useContext, useReducer } from 'react'
import { claimsData } from '../utils/mockData.js'
import { generateId } from '../utils/helpers.js'
import api from '../api/api.js'

const ClaimContext = createContext()

const CLAIM_ACTIONS = {
    CREATE_CLAIM: 'CREATE_CLAIM',
    UPDATE_CLAIM: 'UPDATE_CLAIM',
    DELETE_CLAIM: 'DELETE_CLAIM',
}

// Reducer function to handle claim state updates based on dispatched actions
const claimReducer = (state, action) => {
    switch (action.type) {
        // Add new claim to existing claims array
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
                    claim.claimId === action.payload.claimId ? action.payload : claim,
                ),
            }

        // Remove claim with the given claimId
        case CLAIM_ACTIONS.DELETE_CLAIM:
            return {
                ...state,
                claims: state.claims.filter(claim =>
                    claim.claimId !== action.payload.claimId,
                ),
            }
    }
}

export function ClaimProvider ({ children }) {
    const [state, dispatch] = useReducer(claimReducer, {
        claims: claimsData,
    })

    // Action creators to dispatch actions to the reducer
    const actions = {
        // Fetch existing claims from database
        fetchClaims:()=>{},

        // Create new claim with generated ID and default status/date
        createClaim: async(claim) => {
            try {
                // Log FormData
                for (let [key, value] of claim.entries()) {
                    console.log(key, value);
                }
                const response = await api.post('claims', claim)
                console.log(response)

                const newClaim = response.data

                // Add to local state
                // dispatch({
                //     type: CLAIM_ACTIONS.CREATE_CLAIM,
                //     payload: newClaim,
                // })
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
                updatedAt: new Date().toISOString().split('T')[ 0 ],
            }

            dispatch({ type: CLAIM_ACTIONS.UPDATE_CLAIM, payload: formattedUpdatedClaim })
        },

        // Dispatch delete action with claimId
        deleteClaimById: (claimId) => {
            dispatch({ type: CLAIM_ACTIONS.DELETE_CLAIM, payload: claimId })
        },

        // Helper function to find a claim by ID
        getClaimById: (claimId) => {
            return state.claims.find(claim => claim.claimId === Number(claimId))
        },

    }

    const value = {
        claims: state.claims,
        ...actions,
    }

    return (
        <ClaimContext.Provider value={ value }>
            { children }
        </ClaimContext.Provider>
    )
}

export const useClaims = () => {
    const context = useContext(ClaimContext)
    if (!context) throw new Error('useClaims must be used within UserProvider')
    return context
}