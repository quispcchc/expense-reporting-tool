import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ClaimProvider, useClaims } from '../../src/contexts/ClaimContext.jsx'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'

const wrapper = ({ children }) => <ClaimProvider>{children}</ClaimProvider>

describe('ClaimContext', () => {
    describe('initial state', () => {
        it('provides default values on mount', () => {
            const { result } = renderHook(() => useClaims(), { wrapper })

            expect(result.current.claims).toEqual([])
            expect(result.current.myClaims).toEqual([])
        })
    })

    describe('fetchClaims', () => {
        it('fetches claims from GET /claims and sets state', async () => {
            const { result } = renderHook(() => useClaims(), { wrapper })

            await act(async () => {
                await result.current.fetchClaims()
            })

            expect(result.current.claims).toEqual([
                { claim_id: 1, total_amount: 100, claim_status_id: 1 },
                { claim_id: 2, total_amount: 200, claim_status_id: 2 },
            ])
        })
    })

    describe('fetchMyClaims', () => {
        it('fetches my claims from GET /my-claims and sets state', async () => {
            const { result } = renderHook(() => useClaims(), { wrapper })

            await act(async () => {
                await result.current.fetchMyClaims()
            })

            expect(result.current.myClaims).toEqual([
                { claim_id: 3, total_amount: 50, claim_status_id: 1 },
            ])
        })
    })

    describe('createClaim', () => {
        it('posts to /claims and appends the new claim to state', async () => {
            const { result } = renderHook(() => useClaims(), { wrapper })

            await act(async () => {
                await result.current.createClaim({ total_amount: 150 })
            })

            expect(result.current.claims).toEqual([
                { claim_id: 4, total_amount: 150, claim_status_id: 1 },
            ])
        })
    })

    describe('updateClaim', () => {
        it('updates a claim locally by claim_id and adds updatedAt', async () => {
            const { result } = renderHook(() => useClaims(), { wrapper })

            // First fetch claims so we have data to update
            await act(async () => {
                await result.current.fetchClaims()
            })

            act(() => {
                result.current.updateClaim({ claim_id: 1, total_amount: 999 })
            })

            const updatedClaim = result.current.claims.find(c => c.claim_id === 1)
            expect(updatedClaim.total_amount).toBe(999)
            expect(updatedClaim.updatedAt).toBeDefined()
            // Other claims remain unchanged
            const otherClaim = result.current.claims.find(c => c.claim_id === 2)
            expect(otherClaim.total_amount).toBe(200)
        })
    })

    describe('deleteClaimById', () => {
        it('removes a claim from state by claim_id', async () => {
            const { result } = renderHook(() => useClaims(), { wrapper })

            // Fetch claims first
            await act(async () => {
                await result.current.fetchClaims()
            })
            expect(result.current.claims).toHaveLength(2)

            act(() => {
                result.current.deleteClaimById({ claim_id: 1 })
            })

            expect(result.current.claims).toHaveLength(1)
            expect(result.current.claims[0].claim_id).toBe(2)
        })
    })
})
