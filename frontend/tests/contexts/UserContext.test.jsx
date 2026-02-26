import { renderHook, act, waitFor } from '@testing-library/react'
import { UserProvider, useUser, useUserDispatch } from '../../src/contexts/UserContext.jsx'
import { mockUserData, mockAdminData } from '../mocks/handlers.js'

const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>

describe('UserContext', () => {
    it('auto-fetches users on mount', async () => {
        const { result } = renderHook(() => useUser(), { wrapper })

        // Initially loading
        expect(result.current.loading).toBe(true)

        await waitFor(() => {
            expect(result.current.hasFetched).toBe(true)
        })

        expect(result.current.users).toEqual([mockUserData, mockAdminData])
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
    })

    it('createUser adds a new user to state', async () => {
        const { result } = renderHook(
            () => ({ state: useUser(), dispatch: useUserDispatch() }),
            { wrapper }
        )

        await waitFor(() => {
            expect(result.current.state.hasFetched).toBe(true)
        })

        await act(async () => {
            await result.current.dispatch.createUser({
                first_name: 'New',
                last_name: 'User',
                email: 'new@example.com',
            })
        })

        const newUser = result.current.state.users.find(u => u.user_id === 10)
        expect(newUser).toBeDefined()
        expect(newUser.first_name).toBe('New')
    })

    it('updateUser updates the matching user in state', async () => {
        const { result } = renderHook(
            () => ({ state: useUser(), dispatch: useUserDispatch() }),
            { wrapper }
        )

        await waitFor(() => {
            expect(result.current.state.hasFetched).toBe(true)
        })

        await act(async () => {
            await result.current.dispatch.updateUser({
                user_id: 1,
                first_name: 'Updated',
            })
        })

        const updated = result.current.state.users.find(u => u.user_id === 1)
        expect(updated.first_name).toBe('Updated')
    })

    it('deleteUser removes the user from state', async () => {
        const { result } = renderHook(
            () => ({ state: useUser(), dispatch: useUserDispatch() }),
            { wrapper }
        )

        await waitFor(() => {
            expect(result.current.state.hasFetched).toBe(true)
        })

        await act(async () => {
            await result.current.dispatch.deleteUser(1)
        })

        const deleted = result.current.state.users.find(u => u.user_id === 1)
        expect(deleted).toBeUndefined()
        expect(result.current.state.users).toHaveLength(1)
    })

    it('refresh triggers a re-fetch of users', async () => {
        const { result } = renderHook(
            () => ({ state: useUser(), dispatch: useUserDispatch() }),
            { wrapper }
        )

        await waitFor(() => {
            expect(result.current.state.hasFetched).toBe(true)
        })

        act(() => {
            result.current.dispatch.refresh()
        })

        // hasFetched should be reset, triggering a new fetch
        await waitFor(() => {
            expect(result.current.state.hasFetched).toBe(true)
        })

        expect(result.current.state.users).toEqual([mockUserData, mockAdminData])
    })

    it('sets error state when fetch fails', async () => {
        // Override the handler to simulate an error for this test
        const { server } = await import('../mocks/server.js')
        const { http, HttpResponse } = await import('msw')

        server.use(
            http.get('/api/admin/users', () => {
                return HttpResponse.json(
                    { message: 'Server error' },
                    { status: 500 }
                )
            })
        )

        const { result } = renderHook(() => useUser(), { wrapper })

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        expect(result.current.error).toBeDefined()
    })
})
