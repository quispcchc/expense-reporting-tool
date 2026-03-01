import { claimReducer, CLAIM_ACTIONS } from '../../src/contexts/ClaimContext.jsx'

const initialState = { claims: [], myClaims: [] }

describe('claimReducer', () => {
    it('SET_CLAIMS sets claims array', () => {
        const claims = [
            { claim_id: 1, title: 'Claim A' },
            { claim_id: 2, title: 'Claim B' },
        ]
        const result = claimReducer(initialState, {
            type: CLAIM_ACTIONS.SET_CLAIMS,
            payload: claims,
        })
        expect(result.claims).toEqual(claims)
    })

    it('SET_MY_CLAIMS sets myClaims array', () => {
        const myClaims = [
            { claim_id: 3, title: 'My Claim' },
        ]
        const result = claimReducer(initialState, {
            type: CLAIM_ACTIONS.SET_MY_CLAIMS,
            payload: myClaims,
        })
        expect(result.myClaims).toEqual(myClaims)
    })

    it('CREATE_CLAIM appends new claim to claims array', () => {
        const existingState = {
            ...initialState,
            claims: [{ claim_id: 1, title: 'Existing' }],
        }
        const newClaim = { claim_id: 2, title: 'New Claim' }
        const result = claimReducer(existingState, {
            type: CLAIM_ACTIONS.CREATE_CLAIM,
            payload: newClaim,
        })
        expect(result.claims).toEqual([
            { claim_id: 1, title: 'Existing' },
            { claim_id: 2, title: 'New Claim' },
        ])
    })

    it('UPDATE_CLAIM replaces claim with matching claim_id', () => {
        const existingState = {
            ...initialState,
            claims: [
                { claim_id: 1, title: 'Old Title' },
                { claim_id: 2, title: 'Other' },
            ],
        }
        const updatedClaim = { claim_id: 1, title: 'New Title' }
        const result = claimReducer(existingState, {
            type: CLAIM_ACTIONS.UPDATE_CLAIM,
            payload: updatedClaim,
        })
        expect(result.claims[0]).toEqual({ claim_id: 1, title: 'New Title' })
    })

    it('UPDATE_CLAIM leaves non-matching claims unchanged', () => {
        const existingState = {
            ...initialState,
            claims: [
                { claim_id: 1, title: 'First' },
                { claim_id: 2, title: 'Second' },
            ],
        }
        const updatedClaim = { claim_id: 1, title: 'Updated First' }
        const result = claimReducer(existingState, {
            type: CLAIM_ACTIONS.UPDATE_CLAIM,
            payload: updatedClaim,
        })
        expect(result.claims[1]).toEqual({ claim_id: 2, title: 'Second' })
    })

    it('DELETE_CLAIM removes claim with matching claim_id', () => {
        const existingState = {
            ...initialState,
            claims: [
                { claim_id: 1, title: 'First' },
                { claim_id: 2, title: 'Second' },
            ],
        }
        const result = claimReducer(existingState, {
            type: CLAIM_ACTIONS.DELETE_CLAIM,
            payload: { claim_id: 1 },
        })
        expect(result.claims).toEqual([{ claim_id: 2, title: 'Second' }])
    })

    it('DELETE_CLAIM keeps non-matching claims', () => {
        const existingState = {
            ...initialState,
            claims: [
                { claim_id: 1, title: 'First' },
                { claim_id: 2, title: 'Second' },
                { claim_id: 3, title: 'Third' },
            ],
        }
        const result = claimReducer(existingState, {
            type: CLAIM_ACTIONS.DELETE_CLAIM,
            payload: { claim_id: 2 },
        })
        expect(result.claims).toEqual([
            { claim_id: 1, title: 'First' },
            { claim_id: 3, title: 'Third' },
        ])
    })
})
