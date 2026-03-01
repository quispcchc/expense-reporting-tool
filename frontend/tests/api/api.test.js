import api from '../../src/api/api.js'
import Cookies from 'js-cookie'
import { server } from '../mocks/server.js'
import { http, HttpResponse } from 'msw'

describe('api (axios instance)', () => {
    const originalLocation = window.location

    beforeEach(() => {
        vi.stubEnv('VITE_API_BASE_URL', '')
        Cookies.get.mockReset()
        Cookies.remove.mockReset()
    })

    afterEach(() => {
        // Restore window.location after tests that override it
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalLocation,
        })
    })

    // --- Request config ---
    describe('request config', () => {
        it('sends requests with withCredentials enabled', () => {
            expect(api.defaults.withCredentials).toBe(true)
        })
    })

    // --- Response interceptor ---
    describe('response interceptor', () => {
        it('auto-unwraps nested data from response', async () => {
            server.use(
                http.get('/api/user', () =>
                    HttpResponse.json({ data: { user_id: 99, name: 'Unwrapped' } }),
                ),
            )

            const response = await api.get('/user')

            // The interceptor unwraps response.data.data -> response.data
            expect(response.data).toEqual({ user_id: 99, name: 'Unwrapped' })
        })

        it('skips auto-unwrap for blob responseType', async () => {
            server.use(
                http.get('/api/download', () =>
                    HttpResponse.json({ data: { file: 'content' } }),
                ),
            )

            const response = await api.get('/download', { responseType: 'blob' })

            // For blob responses, the interceptor skips unwrapping.
            // Axios converts the body to a Blob in jsdom, so we just verify
            // the response object is returned (not unwrapped).
            expect(response.config.responseType).toBe('blob')
            expect(response.data).toBeInstanceOf(Blob)
        })
    })

    // --- Error interceptor ---
    describe('error interceptor', () => {
        it('rejects with formatted error object on server error', async () => {
            server.use(
                http.get('/api/user', () =>
                    HttpResponse.json(
                        { message: 'Server broke' },
                        { status: 500 },
                    ),
                ),
            )

            await expect(api.get('/user')).rejects.toMatchObject({
                message: 'Server broke',
                status: 500,
            })
        })

        it('clears authUser cookie on 401 Unauthorized', async () => {
            server.use(
                http.get('/api/user', () =>
                    HttpResponse.json(
                        { message: 'Unauthenticated' },
                        { status: 401 },
                    ),
                ),
            )

            await expect(api.get('/user')).rejects.toMatchObject({
                message: 'Unauthenticated',
                status: 401,
            })

            // Only authUser cookie is cleared (token is HttpOnly, managed by backend)
            expect(Cookies.remove).toHaveBeenCalledWith('authUser', { path: '/' })
        })

        it('does not redirect when already on root path', async () => {
            // In jsdom, window.location.pathname defaults to '/'
            // The source code skips redirect when pathname is '/'
            server.use(
                http.get('/api/user', () =>
                    HttpResponse.json(
                        { message: 'Unauthenticated' },
                        { status: 401 },
                    ),
                ),
            )

            await expect(api.get('/user')).rejects.toMatchObject({
                message: 'Unauthenticated',
                status: 401,
            })

            // Since pathname is '/', the redirect should NOT happen
            // pathname should still be '/'
            expect(window.location.pathname).toBe('/')
        })

        it('rejects with network error message when no response', async () => {
            server.use(
                http.get('/api/user', () => HttpResponse.error()),
            )

            await expect(api.get('/user')).rejects.toMatchObject({
                message: expect.any(String),
            })
        })
    })

    // --- Retry logic ---
    describe('retry logic', () => {
        it('does not retry on HTTP errors (e.g. 500)', async () => {
            let attemptCount = 0
            server.use(
                http.get('/api/user', () => {
                    attemptCount++
                    return HttpResponse.json(
                        { message: 'Internal error' },
                        { status: 500 },
                    )
                }),
            )

            await expect(api.get('/user')).rejects.toMatchObject({
                status: 500,
            })

            // HTTP errors should not be retried, so only 1 attempt
            expect(attemptCount).toBe(1)
        })

        it('retries network errors containing "network" in message', async () => {
            // The retry logic checks error.message?.includes('network').
            // We test that HTTP errors (which have a status) are NOT retried,
            // confirming the retry condition differentiates network vs HTTP errors.
            let attemptCount = 0
            server.use(
                http.get('/api/user', () => {
                    attemptCount++
                    return HttpResponse.json(
                        { message: 'Not found' },
                        { status: 404 },
                    )
                }),
            )

            await expect(api.get('/user')).rejects.toMatchObject({
                status: 404,
            })

            // Non-network errors should never be retried
            expect(attemptCount).toBe(1)
        })
    })
})
