import { useEffect } from 'react'
import api from '../api/api.js'
import { useLoading } from './LoadingContext.jsx'

export const LoadingInterceptor = ({ children }) => {
    const { showLoader, hideLoader } = useLoading()

    useEffect(() => {
        const requestInterceptor = api.interceptors.request.use(
            (config) => {
                showLoader()
                return config
            },
            (error) => {
                hideLoader()
                return Promise.reject(error)
            }
        )

        const responseInterceptor = api.interceptors.response.use(
            (response) => {
                hideLoader()
                return response
            },
            (error) => {
                hideLoader()
                return Promise.reject(error)
            }
        )

        return () => {
            api.interceptors.request.eject(requestInterceptor)
            api.interceptors.response.eject(responseInterceptor)
        }
    }, [showLoader, hideLoader])

    return children
}
