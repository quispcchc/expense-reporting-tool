import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext.jsx'

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear()
        document.documentElement.removeAttribute('data-theme')
    })

    it('defaults to light theme when no localStorage and matchMedia returns false', () => {
        const { result } = renderHook(() => useTheme(), { wrapper })

        expect(result.current.theme).toBe('light')
        expect(result.current.isDark).toBe(false)
    })

    it('reads theme from localStorage', () => {
        localStorage.setItem('theme', 'dark')

        const { result } = renderHook(() => useTheme(), { wrapper })

        expect(result.current.theme).toBe('dark')
        expect(result.current.isDark).toBe(true)
    })

    it('toggleTheme switches from light to dark', () => {
        const { result } = renderHook(() => useTheme(), { wrapper })

        expect(result.current.theme).toBe('light')

        act(() => {
            result.current.toggleTheme()
        })

        expect(result.current.theme).toBe('dark')
        expect(result.current.isDark).toBe(true)
        expect(localStorage.getItem('theme')).toBe('dark')
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('toggleTheme switches from dark to light', () => {
        localStorage.setItem('theme', 'dark')

        const { result } = renderHook(() => useTheme(), { wrapper })

        expect(result.current.theme).toBe('dark')

        act(() => {
            result.current.toggleTheme()
        })

        expect(result.current.theme).toBe('light')
        expect(result.current.isDark).toBe(false)
        expect(localStorage.getItem('theme')).toBe('light')
        expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('isDark is true when theme is dark', () => {
        localStorage.setItem('theme', 'dark')

        const { result } = renderHook(() => useTheme(), { wrapper })

        expect(result.current.isDark).toBe(true)
        expect(result.current.theme).toBe('dark')
    })
})
