import { renderHook, act } from '@testing-library/react'
import { useState } from 'react'
import { ClaimProvider, useClaims } from '../../src/contexts/ClaimContext.jsx'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'

/**
 * Tests for the stale-cache-across-users bug.
 *
 * Problem: When user A logs out and user B logs in, user B still sees
 * user A's cached claims until a page refresh.
 *
 * Solution (two layers):
 * 1. main.jsx keys ClaimProvider by authUser?.user_id — when the user
 *    changes, React unmounts the old provider and mounts a fresh one,
 *    clearing all cached state immediately.
 * 2. ClaimListDataTable calls fetchClaims() on every page load.
 *    Since the provider is fresh (remounted via key), the isFetchingClaims
 *    ref is false and the fetch always proceeds.
 */

// Helper: wrapper whose key can be changed externally to trigger remount
function createKeyedWrapper() {
    let setKeyExternal

    function Wrapper({ children }) {
        const [key, setKey] = useState('user-1')
        setKeyExternal = setKey
        return <ClaimProvider key={key}>{children}</ClaimProvider>
    }

    return {
        Wrapper,
        changeKey: (newKey) => setKeyExternal(newKey),
    }
}

describe('ClaimProvider reset on user change (key-based remount)', () => {
    it('resets claims to empty when the provider key changes', async () => {
        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        // Fetch claims as user 1
        await act(async () => {
            await result.current.fetchClaims()
        })
        expect(result.current.claims).toHaveLength(2)

        // Simulate user change — key change causes ClaimProvider to remount
        act(() => {
            changeKey('user-2')
        })

        // State should be reset to initial values
        expect(result.current.claims).toEqual([])
    })

    it('resets myClaims to empty when the provider key changes', async () => {
        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        await act(async () => {
            await result.current.fetchMyClaims()
        })
        expect(result.current.myClaims).toHaveLength(1)

        act(() => {
            changeKey('user-2')
        })

        expect(result.current.myClaims).toEqual([])
    })

    it('resets both claims and myClaims simultaneously on key change', async () => {
        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        await act(async () => {
            await result.current.fetchClaims()
            await result.current.fetchMyClaims()
        })
        expect(result.current.claims).toHaveLength(2)
        expect(result.current.myClaims).toHaveLength(1)

        act(() => {
            changeKey('user-2')
        })

        expect(result.current.claims).toEqual([])
        expect(result.current.myClaims).toEqual([])
    })

    it('resets state when key changes to guest (logout)', async () => {
        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        await act(async () => {
            await result.current.fetchClaims()
        })
        expect(result.current.claims).toHaveLength(2)

        act(() => {
            changeKey('guest')
        })

        expect(result.current.claims).toEqual([])
    })
})

describe('fresh provider fetches new data from API', () => {
    it('fetches fresh data after key change instead of using stale cache', async () => {
        const superAdminClaims = [
            { claim_id: 1, total_amount: 500 },
            { claim_id: 2, total_amount: 300 },
        ]
        const approverClaims = [
            { claim_id: 3, total_amount: 100 },
        ]

        let currentUser = 'super_admin'
        server.use(
            http.get('/api/claims', () => {
                return HttpResponse.json({
                    data: currentUser === 'super_admin'
                        ? superAdminClaims
                        : approverClaims,
                })
            }),
        )

        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        // Fetch as super admin
        await act(async () => {
            await result.current.fetchClaims()
        })
        expect(result.current.claims).toEqual(superAdminClaims)

        // Switch user: key change remounts provider, API now returns approver data
        currentUser = 'approver'
        act(() => {
            changeKey('user-2')
        })

        // State is cleared
        expect(result.current.claims).toEqual([])

        // Fetch on fresh provider returns approver claims
        await act(async () => {
            await result.current.fetchClaims()
        })
        expect(result.current.claims).toEqual(approverClaims)
    })

    it('makes a new API call after key change since provider is fresh', async () => {
        let callCount = 0
        server.use(
            http.get('/api/claims', () => {
                callCount++
                return HttpResponse.json({
                    data: [{ claim_id: 1, total_amount: 100 }],
                })
            }),
        )

        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        await act(async () => {
            await result.current.fetchClaims()
        })
        expect(callCount).toBe(1)

        // Key change remounts provider — fresh isFetchingClaims ref
        act(() => {
            changeKey('user-2')
        })

        await act(async () => {
            await result.current.fetchClaims()
        })
        expect(callCount).toBe(2)
    })
})

describe('full logout → login simulation', () => {
    it('user B sees different claims than user A after key change + fetch', async () => {
        const userAClaims = [
            { claim_id: 10, total_amount: 1000 },
            { claim_id: 11, total_amount: 2000 },
            { claim_id: 12, total_amount: 3000 },
        ]
        const userBClaims = [
            { claim_id: 20, total_amount: 50 },
        ]

        let sessionUserId = 'user-A'
        server.use(
            http.get('/api/claims', () => {
                return HttpResponse.json({
                    data: sessionUserId === 'user-A' ? userAClaims : userBClaims,
                })
            }),
        )

        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        // --- User A session ---
        await act(async () => {
            await result.current.fetchClaims()
        })
        expect(result.current.claims).toEqual(userAClaims)
        expect(result.current.claims).toHaveLength(3)

        // --- Logout: key → 'guest' ---
        act(() => {
            changeKey('guest')
        })
        expect(result.current.claims).toEqual([])

        // --- Login as User B: key → 'user-B', backend now returns B's claims ---
        sessionUserId = 'user-B'
        act(() => {
            changeKey('user-B')
        })
        expect(result.current.claims).toEqual([])

        // --- User B page load: fetch on fresh provider ---
        await act(async () => {
            await result.current.fetchClaims()
        })

        // User B sees only their own claim, NOT user A's 3 claims
        expect(result.current.claims).toEqual(userBClaims)
        expect(result.current.claims).toHaveLength(1)
        expect(result.current.claims[0].claim_id).toBe(20)
    })

    it('user B myClaims are independent from user A myClaims', async () => {
        const userAMyClaims = [
            { claim_id: 100, total_amount: 500 },
            { claim_id: 101, total_amount: 600 },
        ]
        const userBMyClaims = [
            { claim_id: 200, total_amount: 25 },
            { claim_id: 201, total_amount: 30 },
            { claim_id: 202, total_amount: 35 },
        ]

        let sessionUserId = 'user-A'
        server.use(
            http.get('/api/my-claims', () => {
                return HttpResponse.json({
                    data: sessionUserId === 'user-A' ? userAMyClaims : userBMyClaims,
                })
            }),
        )

        const { Wrapper, changeKey } = createKeyedWrapper()
        const { result } = renderHook(() => useClaims(), { wrapper: Wrapper })

        // User A fetches myClaims
        await act(async () => {
            await result.current.fetchMyClaims()
        })
        expect(result.current.myClaims).toEqual(userAMyClaims)

        // Logout → Login as User B
        sessionUserId = 'user-B'
        act(() => {
            changeKey('guest')
        })
        act(() => {
            changeKey('user-B')
        })

        // User B fetches myClaims
        await act(async () => {
            await result.current.fetchMyClaims()
        })

        expect(result.current.myClaims).toEqual(userBMyClaims)
        expect(result.current.myClaims).toHaveLength(3)
    })
})
