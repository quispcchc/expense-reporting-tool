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
        // Handle error
        let message = "An unknown error occurred";

        if (error.response) {
        //     // Server responded with a status code outside 2xx
        //     const status = error.response.status;
            // switch (status) {
            //     case 400:
            //         message = "Bad Request – Invalid input";
            //         break;
        //         case 401:
        //             message = "Unauthorized – Please login";
        //             // Optional: redirect to login page
        //             break;
        //         case 403:
        //             message = "Forbidden – You don’t have permission";
        //             break;
        //         case 404:
        //             message = "Not Found – Resource does not exist";
        //             break;
        //         case 422:
        //             // Validation errors from Laravel
        //             message = error.response.data?.errors
        //                 ? Object.values(error.response.data.errors).flat().join(", ")
        //                 : "Validation error";
        //             break;
        //         case 500:
        //             message = "Server error – Please try again later";
        //             break;
        //         default:
                    message = error.response.data?.message
            // }
        // }else if (error.request) {
        //     // Request made but no response received
        //     message = "Network error – Please check your connection";
        // } else {
        //     // Something else happened
        //     message = error.message;
        }

        return Promise.reject({ message, status: error.response?.status });
    },
)

export default api