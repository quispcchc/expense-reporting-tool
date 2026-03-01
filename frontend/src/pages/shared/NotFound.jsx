import React from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROLE_NAME } from '../../config/constants.js'

function NotFound(props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { authUser } = useAuth()

    // Function to go back to previous page if possible, otherwise go to home page
    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/')
        }
    }

    const getHomePath
      = () => {
        if (!authUser) return '/login'
        if (authUser.role_name === ROLE_NAME.USER) return '/user'
        return '/admin'
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* 404 Number */}
                <div>
                    <h1 className="text-9xl font-bold text-gray-200">404</h1>
                    <h2 className="mt-4 text-3xl font-bold text-gray-900">{t('errors.pageNotFound', 'Page not found')}</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {t('errors.pageNotFoundDescription', "Sorry, we couldn't find the page you're looking for.")}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={goBack}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="mr-2 -ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('common.goBack', 'Go back')}
                        </button>

                        <Link
                            to={getHomePath()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="mr-2 -ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {t('errors.goToDashboard', 'Go to Dashboard')}
                        </Link>
                    </div>

                </div>

                {/* Support */}
                <div className="mt-8 text-xs text-gray-500">
                    {t('errors.needHelp', 'Need help?')}{' '}
                    <a href="/" className="text-blue-600 hover:text-blue-500">
                        {t('errors.contactSupport', 'Contact support')}
                    </a>
                </div>
            </div>
        </div>
    )
}

export default NotFound