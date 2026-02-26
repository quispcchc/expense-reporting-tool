import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../src/contexts/AuthContext.jsx'
import { LookupProvider, useLookups } from '../../src/contexts/LookupContext.jsx'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'
import Cookies from 'js-cookie'

const wrapper = ({ children }) => (
    <MemoryRouter>
        <AuthProvider>
            <LookupProvider>{children}</LookupProvider>
        </AuthProvider>
    </MemoryRouter>
)

/** Helper: set cookies so AuthContext considers the user authenticated */
function mockAuthenticated() {
    Cookies.get.mockImplementation((key) => {
        if (key === 'token') return 'fake-token'
        if (key === 'authUser') return JSON.stringify({ user_id: 1 })
        return undefined
    })
}

/** Helper: clear cookies so AuthContext considers the user unauthenticated */
function mockUnauthenticated() {
    Cookies.get.mockReturnValue(undefined)
}

describe('LookupContext', () => {
    beforeEach(() => {
        Cookies.get.mockReset()
        Cookies.set.mockReset()
        Cookies.remove.mockReset()
    })

    describe('when not authenticated', () => {
        it('does not fetch lookups and sets loading to false', async () => {
            mockUnauthenticated()

            const { result } = renderHook(() => useLookups(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            // Lookups should remain at defaults (empty arrays)
            expect(result.current.lookups.roles).toEqual([])
            expect(result.current.lookups.teams).toEqual([])
            expect(result.current.error).toBeNull()
        })
    })

    describe('when authenticated', () => {
        it('auto-fetches lookups on mount and populates state', async () => {
            mockAuthenticated()

            const { result } = renderHook(() => useLookups(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.lookups.roles).toEqual([
                { role_id: 1, role_name: 'super_admin' },
            ])
            expect(result.current.lookups.teams).toEqual([
                { team_id: 1, team_name: 'Team A' },
            ])
            expect(result.current.lookups.departments).toEqual([
                { department_id: 1, department_name: 'Engineering' },
            ])
            expect(result.current.lookups.tags).toEqual([
                { tag_id: 1, tag_name: 'Travel' },
            ])
            expect(result.current.error).toBeNull()
        })

        it('sets error state when the API call fails', async () => {
            mockAuthenticated()

            server.use(
                http.get('/api/lookups', () =>
                    HttpResponse.json(
                        { message: 'Internal Server Error' },
                        { status: 500 },
                    ),
                ),
            )

            const { result } = renderHook(() => useLookups(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.error).toBeTruthy()
        })

        it('refreshLookups forces a new fetch', async () => {
            mockAuthenticated()

            let callCount = 0
            server.use(
                http.get('/api/lookups', () => {
                    callCount++
                    return HttpResponse.json({
                        data: {
                            roles: [{ role_id: 1, role_name: 'super_admin' }],
                            teams: [],
                            departments: [],
                            positions: [],
                            activeStatuses: [],
                            costCentres: [],
                            projects: [],
                            accountNums: [],
                            claimTypes: [],
                            claimStatus: [],
                            tags: [],
                        },
                    })
                }),
            )

            const { result } = renderHook(() => useLookups(), { wrapper })

            // Wait for initial auto-fetch
            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })
            expect(callCount).toBe(1)

            // Force refresh
            await act(async () => {
                await result.current.refreshLookups()
            })

            expect(callCount).toBe(2)
        })

        it('populates all lookup fields from the API response', async () => {
            mockAuthenticated()

            const { result } = renderHook(() => useLookups(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const { lookups } = result.current
            expect(lookups.positions).toEqual([{ position_id: 1, position_name: 'Volunteer' }])
            expect(lookups.activeStatuses).toEqual([{ active_status_id: 1, active_status_name: 'active' }])
            expect(lookups.costCentres).toEqual([{ cost_centre_id: 1, cost_centre_code: 1001 }])
            expect(lookups.projects).toEqual([{ project_id: 1, project_name: 'Project A' }])
            expect(lookups.accountNums).toEqual([{ account_number_id: 1, account_number: 5001 }])
            expect(lookups.claimTypes).toEqual([{ claim_type_id: 1, claim_type_name: 'Expense' }])
            expect(lookups.claimStatus).toEqual([{ claim_status_id: 1, claim_status_name: 'Pending' }])
        })
    })

    describe('useLookups outside provider', () => {
        it('throws an error when used without LookupProvider', () => {
            // Suppress console.error for the expected error
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

            expect(() => {
                renderHook(() => useLookups())
            }).toThrow('useLookups must be used within a LookupProvider')

            spy.mockRestore()
        })
    })
})
