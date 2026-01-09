import axios from 'axios'

// Export the base URL for use in other components
export const API_BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`, // Base URL for all API requests
    timeout: 10000, // Request timeout set to 10 seconds
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

        if (error.response) {
            message = error.response.data?.message
        }

        return Promise.reject({ message, status: error.response?.status });
    },
)

export default api