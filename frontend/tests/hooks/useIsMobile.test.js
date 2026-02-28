import { renderHook, act } from '@testing-library/react'
import { useIsMobile, useForceMobileToggle } from '../../src/hooks/useIsMobile.js'

describe('useIsMobile', () => {
    const originalInnerWidth = window.innerWidth

    beforeEach(() => {
        localStorage.clear()
        // Reset to default jsdom width (1024)
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        })
    })

    afterEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth,
        })
    })

    it('returns false for wide viewport (default jsdom is 1024)', () => {
        const { result } = renderHook(() => useIsMobile())

        expect(result.current).toBe(false)
    })

    it('returns true when window.innerWidth < breakpoint', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        })

        const { result } = renderHook(() => useIsMobile())

        expect(result.current).toBe(true)
    })

    it('respects custom breakpoint parameter', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 900,
        })

        const { result: below } = renderHook(() => useIsMobile(1000))
        expect(below.current).toBe(true)

        const { result: above } = renderHook(() => useIsMobile(800))
        expect(above.current).toBe(false)
    })

    it('responds to resize events', () => {
        const { result } = renderHook(() => useIsMobile())

        expect(result.current).toBe(false)

        act(() => {
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 500,
            })
            window.dispatchEvent(new Event('resize'))
        })

        expect(result.current).toBe(true)
    })

    it('forceMobile from localStorage overrides natural width', () => {
        localStorage.setItem('forceMobileView', 'true')

        const { result } = renderHook(() => useIsMobile())

        // Window is 1024 (wide), but forceMobile overrides
        expect(result.current).toBe(true)
    })
})

describe('useForceMobileToggle', () => {
    beforeEach(() => {
        localStorage.clear()
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        })
    })

    it('toggleForceMobile toggles localStorage value', () => {
        const { result } = renderHook(() => useForceMobileToggle())

        expect(result.current.forceMobile).toBe(false)
        expect(localStorage.getItem('forceMobileView')).toBeNull()

        act(() => {
            result.current.toggleForceMobile()
        })

        expect(result.current.forceMobile).toBe(true)
        expect(localStorage.getItem('forceMobileView')).toBe('true')

        act(() => {
            result.current.toggleForceMobile()
        })

        expect(result.current.forceMobile).toBe(false)
        expect(localStorage.getItem('forceMobileView')).toBeNull()
    })

    it('toggleForceMobile dispatches forceMobileChanged event', () => {
        const { result } = renderHook(() => useForceMobileToggle())
        const listener = vi.fn()

        window.addEventListener('forceMobileChanged', listener)

        act(() => {
            result.current.toggleForceMobile()
        })

        expect(listener).toHaveBeenCalledTimes(1)

        window.removeEventListener('forceMobileChanged', listener)
    })
})
