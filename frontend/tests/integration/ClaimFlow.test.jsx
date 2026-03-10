/**
 * Integration tests for claim creation, fetching, and management flows.
 *
 * Tests verify that ClaimContext dispatches correctly when interacting
 * with the MSW-mocked API, and that multiple contexts work together.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext.jsx'
import { ClaimProvider, useClaims } from '../../src/contexts/ClaimContext.jsx'
import { LookupProvider, useLookups } from '../../src/contexts/LookupContext.jsx'
import Cookies from 'js-cookie'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'
import { mockUserData, mockAdminData } from '../mocks/handlers.js'

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Wrapper with all providers
const AllProviders = ({ children }) => (
    <MemoryRouter>
        <AuthProvider>
            <LookupProvider>
                <ClaimProvider>
                    {children}
                </ClaimProvider>
            </LookupProvider>
        </AuthProvider>
    </MemoryRouter>
)

describe('Claim Flow Integration', () => {
    beforeEach(() => {
        Cookies.get.mockReset()
        Cookies.set.mockReset()
        Cookies.remove.mockReset()
        Cookies.get.mockReturnValue(undefined)
    })

    // ─── Login → Fetch Claims → Verify Data ────────────────────────

    it('login then fetch claims populates claim state', async () => {
        // Use a combined hook to access both auth and claims
        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        // Login
        await act(async () => {
            await result.current.auth.login({
                email: 'test@example.com',
                password: 'password',
            })
        })
        expect(result.current.auth.authUser).toEqual(mockUserData)

        // Fetch claims
        await act(async () => {
            await result.current.claims.fetchClaims()
        })

        await waitFor(() => {
            expect(result.current.claims.claims).toHaveLength(2)
            expect(result.current.claims.claims[0].claim_id).toBe(1)
            expect(result.current.claims.claims[1].claim_id).toBe(2)
        })
    })

    // ─── Login → Fetch My Claims → Verify User-specific Data ───────

    it('login then fetch my-claims returns user-specific claims', async () => {
        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        await act(async () => {
            await result.current.auth.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        await act(async () => {
            await result.current.claims.fetchMyClaims()
        })

        await waitFor(() => {
            expect(result.current.claims.myClaims).toHaveLength(1)
            expect(result.current.claims.myClaims[0].claim_id).toBe(3)
        })
    })

    // ─── Create Claim → State Updated ───────────────────────────────

    it('create claim adds to local state', async () => {
        const newClaim = {
            position_id: 1,
            claim_type_id: 1,
            department_id: 1,
            team_id: 1,
            total_amount: 150,
            expenses: [
                {
                    transaction_date: '2026-03-10',
                    account_number_id: 1,
                    buyer_name: 'John',
                    vendor_name: 'Staples',
                    expense_amount: 150,
                    project_id: 1,
                    cost_centre_id: 1,
                },
            ],
        }

        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        // Login
        await act(async () => {
            await result.current.auth.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        // Create claim
        await act(async () => {
            await result.current.claims.createClaim(newClaim)
        })

        await waitFor(() => {
            // The newly created claim should be in the claims array
            expect(result.current.claims.claims).toHaveLength(1)
            expect(result.current.claims.claims[0].claim_id).toBe(4)
            expect(result.current.claims.claims[0].total_amount).toBe(150)
        })
    })

    // ─── Fetch Claims → Update Claim → Verify State ─────────────────

    it('fetch claims then update a claim modifies state', async () => {
        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        await act(async () => {
            await result.current.auth.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        // Fetch claims
        await act(async () => {
            await result.current.claims.fetchClaims()
        })

        await waitFor(() => {
            expect(result.current.claims.claims).toHaveLength(2)
        })

        // Update claim 1
        act(() => {
            result.current.claims.updateClaim({
                claim_id: 1,
                total_amount: 999,
                claim_status_id: 2,
            })
        })

        expect(result.current.claims.claims[0].total_amount).toBe(999)
        expect(result.current.claims.claims[0].claim_status_id).toBe(2)
        // Claim 2 unchanged
        expect(result.current.claims.claims[1].total_amount).toBe(200)
    })

    // ─── Fetch Claims → Delete Claim → Verify Removed ───────────────

    it('delete claim removes it from state', async () => {
        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        await act(async () => {
            await result.current.auth.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        await act(async () => {
            await result.current.claims.fetchClaims()
        })

        await waitFor(() => {
            expect(result.current.claims.claims).toHaveLength(2)
        })

        act(() => {
            result.current.claims.deleteClaimById({ claim_id: 1 })
        })

        expect(result.current.claims.claims).toHaveLength(1)
        expect(result.current.claims.claims[0].claim_id).toBe(2)
    })

    // ─── Login → Fetch Lookups → Verify Data Available ──────────────

    it('lookups load after authentication', async () => {
        // Simulate user is authenticated (cookie present)
        Cookies.get.mockReturnValue(JSON.stringify(mockUserData))

        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                lookups: useLookups(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        // After auth initializes, lookups should auto-fetch
        await waitFor(() => {
            expect(result.current.lookups.loading).toBe(false)
        })

        expect(result.current.lookups.lookups.departments).toHaveLength(1)
        expect(result.current.lookups.lookups.departments[0].department_name).toBe('Engineering')
        expect(result.current.lookups.lookups.teams).toHaveLength(1)
        expect(result.current.lookups.lookups.claimTypes).toHaveLength(1)
        expect(result.current.lookups.lookups.tags).toHaveLength(1)
    })

    // ─── Create Claim with Server Error → State Unchanged ───────────

    it('create claim failure does not add claim to state', async () => {
        server.use(
            http.post('/api/claims', () =>
                HttpResponse.json(
                    { message: 'Validation failed' },
                    { status: 422 }
                ),
            ),
        )

        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        await act(async () => {
            await result.current.auth.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        // Attempt to create invalid claim
        try {
            await act(async () => {
                await result.current.claims.createClaim({})
            })
        } catch {
            // Expected to throw
        }

        // Claims should remain empty
        expect(result.current.claims.claims).toHaveLength(0)
    })

    // ─── Get Claim By ID → Returns Full Data ───────────────────────

    it('getClaimById fetches individual claim details', async () => {
        const detailedClaim = {
            claim_id: 1,
            total_amount: 250,
            claim_status_id: 1,
            expenses: [
                { expense_id: 10, expense_amount: 150, vendor_name: 'Staples' },
                { expense_id: 11, expense_amount: 100, vendor_name: 'Best Buy' },
            ],
            claim_notes: [
                { claim_note_text: 'Office supplies' },
            ],
        }

        server.use(
            http.get('/api/claims/1', () =>
                HttpResponse.json({ data: detailedClaim })
            ),
        )

        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        await act(async () => {
            await result.current.auth.login({
                email: 'test@example.com',
                password: 'password',
            })
        })

        let claim
        await act(async () => {
            claim = await result.current.claims.getClaimById(1)
        })

        expect(claim.claim_id).toBe(1)
        expect(claim.total_amount).toBe(250)
        expect(claim.expenses).toHaveLength(2)
        expect(claim.claim_notes[0].claim_note_text).toBe('Office supplies')
    })

    // ─── Admin Fetches All Claims → Gets Full List ──────────────────

    it('admin user fetches all claims including other users claims', async () => {
        const allClaims = [
            { claim_id: 1, total_amount: 100, user_id: 1 },
            { claim_id: 2, total_amount: 200, user_id: 2 },
            { claim_id: 3, total_amount: 300, user_id: 3 },
        ]

        server.use(
            http.post('/api/login', () =>
                HttpResponse.json({ data: { user: mockAdminData } })
            ),
            http.get('/api/claims', () =>
                HttpResponse.json({ data: allClaims })
            ),
        )

        const { result } = renderHook(
            () => ({
                auth: useAuth(),
                claims: useClaims(),
            }),
            { wrapper: AllProviders }
        )

        await waitFor(() => expect(result.current.auth.isLoading).toBe(false))

        await act(async () => {
            await result.current.auth.login({
                email: 'admin@example.com',
                password: 'password',
            })
        })

        expect(result.current.auth.authUser.role_name).toBe('super_admin')

        await act(async () => {
            await result.current.claims.fetchClaims()
        })

        await waitFor(() => {
            expect(result.current.claims.claims).toHaveLength(3)
        })
    })
})
