import axios from 'axios'

// Export the base URL for use in other components
export const API_BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`, // Base URL for all API requests
    timeout: 60000, // Request timeout set to 60 seconds (for PDF generation)
})

// Add a request interceptor to attach the Authorization header if a token exists
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token')

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

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Handle error
        let message = "An unknown error occurred";
        let status = undefined;
        let fullError = error;

        if (error.response) {
            // Server responded with error status
            status = error.response.status;
            message = error.response.data?.message || error.response.data?.error || `Error: ${status}`;
            fullError = error.response.data;
        } else if (error.request) {
            // Request made but no response
            message = "No response from server. This may be a timeout or network error.";
        } else if (error.message) {
            // Error in request setup
            message = error.message;
        }

        console.error('API Error:', message, status);
        return Promise.reject({ message, status, fullError });
    },
)

export default api