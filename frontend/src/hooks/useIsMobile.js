import { useEffect, useState, useCallback } from 'react';

const FORCE_MOBILE_KEY = 'forceMobileView';

/**
 * Custom hook to detect if the screen is mobile size
 * Supports forced mobile view mode via localStorage
 * @param {number} breakpoint - The breakpoint in pixels (default: 768)
 * @returns {boolean} - True if the screen width is less than the breakpoint OR force mobile is on
 */
export function useIsMobile(breakpoint = 768) {
    const [forceMobile, setForceMobile] = useState(() => {
        try {
            return localStorage.getItem(FORCE_MOBILE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const [isNaturalMobile, setIsNaturalMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );

    useEffect(() => {
        const onResize = () => setIsNaturalMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [breakpoint]);

    // Listen for changes from other components via custom event
    useEffect(() => {
        const onForceChange = () => {
            try {
                setForceMobile(localStorage.getItem(FORCE_MOBILE_KEY) === 'true');
            } catch {
                setForceMobile(false);
            }
        };
        window.addEventListener('forceMobileChanged', onForceChange);
        return () => window.removeEventListener('forceMobileChanged', onForceChange);
    }, []);

    return forceMobile || isNaturalMobile;
}

/**
 * Hook to manage the force mobile view toggle
 * Returns the current state and a toggle function
 */
export function useForceMobileToggle() {
    const [forceMobile, setForceMobile] = useState(() => {
        try {
            return localStorage.getItem(FORCE_MOBILE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const [isNaturalMobile, setIsNaturalMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );

    useEffect(() => {
        const onResize = () => setIsNaturalMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const toggleForceMobile = useCallback(() => {
        const newValue = !forceMobile;
        try {
            if (newValue) {
                localStorage.setItem(FORCE_MOBILE_KEY, 'true');
            } else {
                localStorage.removeItem(FORCE_MOBILE_KEY);
            }
        } catch { /* ignore */ }
        setForceMobile(newValue);
        // Notify other useIsMobile instances
        window.dispatchEvent(new Event('forceMobileChanged'));
    }, [forceMobile]);

    return {
        forceMobile,
        isNaturalMobile,
        toggleForceMobile,
    };
}

export default useIsMobile;
