import axios from 'axios'

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', // Base URL for all API requests
    timeout: 10000, // Request timeout set to 10 seconds
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add a request interceptor to attach the Authorization header if a token exists
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token')

        if (token) {
            const cleanToken = token.replace(/^"|"$/g, '')
            config.headers.Authorization = `Bearer ${ cleanToken }`
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
        if (error.response?.status === 401) {
            return Promise.reject(new Error('Email or Password is not correct. Please Try Again!'))
        }

        if (error.response?.status === 403) {
            return Promise.reject(new Error('Access Denied'))
        }

        const message = error.response?.data?.message ||
            error.response?.data ||
            error.message ||
            'Request Failed'
        return Promise.reject(new Error(message))
    },
)

export default api