import { useEffect, useState } from 'react';

/**
 * Custom hook to detect if the screen is mobile size
 * @param {number} breakpoint - The breakpoint in pixels (default: 768)
 * @returns {boolean} - True if the screen width is less than the breakpoint
 */
export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [breakpoint]);

    return isMobile;
}

export default useIsMobile;
