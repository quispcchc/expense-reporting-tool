import axios from 'axios'
import i18n from '../i18n/index.js' // Import i18n instance

// Export the base URL for use in other components
// In production with Nginx reverse proxy, use empty string for relative /api paths
// In development, VITE_API_BASE_URL should be set to http://127.0.0.1:8000
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`, // Base URL for all API requests
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 300000, // Request timeout set to 300 seconds (5 minutes) for PDF generation
})

import Cookies from 'js-cookie'

// Add a request interceptor to attach the Authorization header if a token exists
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token')

        if (token) {
            const cleanToken = token.replace(/^"|"$/g, '')
            config.headers.Authorization = `Bearer ${cleanToken}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

// Add a response interceptor to handle errors globally and auto-unwrap data
api.interceptors.response.use(
    (response) => {
        // Auto-unwrap: if response follows { success, data } format, return unwrapped data
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            response.data = response.data.data
        }
        return response
    },
    (error) => {
        // Handle error
        let message = i18n.t('errors.unknownError');
        let status = undefined;
        let fullError = error;

        if (error.response) {
            // Server responded with error status
            status = error.response.status;
            message = error.response.data?.message || error.response.data?.error || `Error: ${status}`;
            fullError = error.response.data;

            // Handle 401 Unauthorized globally
            if (status === 401) {
                console.warn('Unauthorized access. Clearing session and redirecting.');
                Cookies.remove('token', { path: '/' });
                Cookies.remove('authUser', { path: '/' });

                // Optional: Redirect to login or reload page to let AuthContext handle it
                // We check if we are already on the login page or root to avoid loops
                // Also fetching /user on mount can trigger this, so we must be careful not to infinite reload
                const currentPath = window.location.pathname;
                if (currentPath !== '/' && !currentPath.startsWith('/login')) {
                    window.location.href = '/login';
                }
            }
        } else if (error.request) {
            // Request made but no response
            message = i18n.t('errors.networkError');
        } else if (error.message) {
            // Error in request setup
            message = error.message;
        }

        console.error('API Error:', message, status);
        return Promise.reject({ message, status, fullError });
    },
)

// Retry logic for network errors (ERR_CONNECTION_RESET, timeouts)
const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

const originalRequest = api.request.bind(api);
api.request = async function (config) {
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await originalRequest(config);
        } catch (error) {
            lastError = error;
            // Only retry on network errors (no response), not on HTTP errors
            const isNetworkError = !error.status && error.message?.includes('network');
            if (isNetworkError && attempt < MAX_RETRIES) {
                console.warn(`Network error, retrying (${attempt + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

export default api
