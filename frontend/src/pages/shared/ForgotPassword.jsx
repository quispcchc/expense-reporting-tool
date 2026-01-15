import React, { useState, useRef } from 'react'
import Input from '../../components/common/ui/Input.jsx'
import { Button } from 'primereact/button'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { validateForm } from '../../utils/validation/validator.js'
import { validationSchemas } from '../../utils/validation/schemas.js'
import { Link } from 'react-router-dom'
import Loader from '../../components/common/ui/Loader.jsx'
import { useTranslation } from 'react-i18next'
import { Toast } from 'primereact/toast'
import { showToast } from '../../utils/helpers.js'
import LanguageSwitcher from '../../components/common/ui/LanguageSwitcher.jsx'
import ThemeSwitcher from '../../components/common/ui/ThemeSwitcher.jsx'


function ForgotPassword() {
    const { t } = useTranslation()
    const toastRef = useRef(null)
    
    // Form state
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState(null)
    const [isLinkSent, setIsLinkSent] = useState(false)
    const [resetInfo, setResetInfo] = useState(null)
    
    // API state
    const { forgetPassword, error: apiError, isLoading } = useAuth()

    /**
     * Handle forgot password form submission
     */
    const handleVerifyEmail = async (e) => {
        e.preventDefault()
        
        // Clear previous errors
        setEmailError(null)

        // Validate email input
        const schema = validationSchemas.forgotPassword
        const validation = validateForm({ email }, schema)

        if (!validation.isValid) {
            setEmailError(validation.errors)
            showToast(toastRef, {
                severity: 'error',
                summary: t('passwordReset.validationError', 'Validation Error'),
                detail: t('passwordReset.pleaseCheckEmail', 'Please check your email address')
            })
            return
        }

        // Call forgetPassword API
        const result = await forgetPassword(email)

        if (result?.success) {
            setResetInfo(result)
            setIsLinkSent(true)
            showToast(toastRef, {
                severity: 'success',
                summary: t('passwordReset.success', 'Success'),
                detail: t('passwordReset.linkSentSuccess', 'Reset link sent to your email')
            })
        } else {
            setIsLinkSent(false)
            showToast(toastRef, {
                severity: 'error',
                summary: t('passwordReset.error', 'Error'),
                detail: result?.message || apiError
            })
        }
    }

    /**
     * Reset form to initial state
     */
    const handleReset = () => {
        setEmail('')
        setEmailError(null)
        setIsLinkSent(false)
        setResetInfo(null)
    }

    return (
        <>
            <Toast ref={toastRef} />
            
            {/* Theme and Language Switchers */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
            </div>
            
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
                <div className="w-full max-w-md">
                    {!isLinkSent ? (
                        // Forgot Password Form
                        <form onSubmit={handleVerifyEmail} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
                            {/* Header */}
                            <div className="text-center">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    {t('passwordReset.forgotPassword', 'Forgot your password?')}
                                </h1>
                                <p className="text-gray-600 text-sm">
                                    {t('passwordReset.enterEmail', "Please enter the email address you'd like your password reset link sent to")}
                                </p>
                            </div>

                            {/* Email Input */}
                            <Input
                                name="email"
                                id="email"
                                type="email"
                                label={t('passwordReset.pleaseEnterEmail', 'Email Address')}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                // errors={emailError}
                                disabled={isLoading}
                            />

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                label={t('passwordReset.requestResetLink', 'Request Reset Link')}
                                className="w-full"
                                loading={isLoading}
                                disabled={isLoading}
                            />

                            {/* Back to Login Link */}
                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                >
                                    {t('passwordReset.backToLogin', 'Back to Login')}
                                </Link>
                            </div>
                        </form>
                    ) : (
                        // Success Message with Reset Link
                        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 text-center">
                            {/* Success Icon */}
                            <div className="flex justify-center">
                                <div className="bg-green-100 rounded-full p-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Success Message */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    {t('passwordReset.checkYourEmail', 'Check your email')}
                                </h2>
                                <p className="text-gray-600 text-sm">
                                    {resetInfo && resetInfo.email 
                                        ? t('passwordReset.resetLinkSent', `We've sent a password reset link to ${resetInfo.email}`)
                                        : t('passwordReset.resetLinkSentGeneric', 'We\'ve sent a password reset link to your email')}
                                </p>
                            </div>

                            {/* Reset Link */}
                            {/* {resetInfo?.token && (
                                <Link
                                    to={`/reset-password?email=${encodeURIComponent(resetInfo.email)}&token=${encodeURIComponent(resetInfo.token)}`}
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                >
                                    {t('passwordReset.resetPassword', 'Reset Password')} →
                                </Link>
                            )} */}

                            {/* Note */}
                            <p className="text-gray-500 text-xs">
                                {t('passwordReset.linkExpires', 'The reset link expires in 24 hours')}
                            </p>

                            {/* Back to Login Button */}
                            <Button
                                type="button"
                                label={t('passwordReset.backToLogin', 'Back to Login')}
                                severity="secondary"
                                className="w-full"
                                onClick={() => {
                                    window.location.href = '/login'
                                }}
                            />

                            {/* Send Another Link */}
                            <button
                                type="button"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                onClick={handleReset}
                            >
                                {t('passwordReset.sendAnother', 'Send another reset link')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {isLoading && <Loader />}
        </>
    )
}

export default ForgotPassword