import React, { useState, useRef } from 'react'
import { Button } from 'primereact/button'
import { validationSchemas } from '../../utils/validation/schemas.js'
import { validateForm } from '../../utils/validation/validator.js'
import InputPassword from '../../components/common/ui/InputPassword.jsx'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'
import { Toast } from 'primereact/toast'
import { showToast } from '../../utils/helpers.js'
import Loader from '../../components/common/ui/Loader.jsx'
import LanguageSwitcher from '../../components/common/ui/LanguageSwitcher.jsx'
import ThemeSwitcher from '../../components/common/ui/ThemeSwitcher.jsx'

function ResetPassword() {
    const navigate = useNavigate()
    const toastRef = useRef(null)
    const { t } = useTranslation()

    // Form state
    const [formData, setFormData] = useState({
        password: '',
        repeatPassword: '',
    })
    const [formErrors, setFormErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    // API state
    const { resetPassword, error: apiError } = useAuth()

    // Get email and token from URL params
    const query = new URLSearchParams(useLocation().search)
    const emailFromQuery = query.get('email')
    const tokenFromQuery = query.get('token')

    /**
     * Handle form input changes
     */
    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    /**
     * Handle password reset form submission
     */
    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        // Validate form inputs
        const schema = validationSchemas.resetPassword
        const validation = validateForm(formData, schema)
        setFormErrors(validation.errors)

        if (!validation.isValid) {
            setIsLoading(false)
            showToast(toastRef, {
                severity: 'error',
                summary: t('passwordReset.validationError', 'Validation Error'),
                detail: t('passwordReset.pleaseCheckFields', 'Please check your input fields')
            })
            return
        }

        // Call resetPassword API
        const result = await resetPassword({
            email: emailFromQuery,
            token: tokenFromQuery,
            password: formData.password,
            password_confirmation: formData.repeatPassword
        })

        setIsLoading(false)

        if (result?.success) {
            showToast(toastRef, {
                severity: 'success',
                summary: t('passwordReset.success', 'Success'),
                detail: t('passwordReset.updateSuccess', 'Password reset successfully!')
            })

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } else {
            showToast(toastRef, {
                severity: 'error',
                summary: t('passwordReset.error', 'Error'),
                detail: result?.message || apiError || 'Failed to reset password'
            })
        }
    }

    /**
     * Reset form to initial state
     */
    const handleResetForm = () => {
        setFormData({
            password: '',
            repeatPassword: '',
        })
        setFormErrors({})
    }

    return (
        <>
            <Toast ref={toastRef} />

            {/* Theme and Language Switchers */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
            </div>

            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
                <div className="w-full max-w-lg">
                    {/* Reset Password Form */}
                    <form
                        onSubmit={handlePasswordSubmit}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6 transition-colors duration-200"
                    >
                        {/* Header with Icon */}
                        <div className="space-y-4 text-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-900/50 mx-auto">
                                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('passwordReset.resetPassword', 'Reset Password')}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                    {t('passwordReset.resetPasswordDescription', 'Create a new secure password for your account')}
                                </p>
                            </div>
                        </div>

                        {/* Email Info */}
                        {emailFromQuery && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-400">
                                    <span className="font-semibold">{t('common.email', 'Email')}:</span> {emailFromQuery}
                                </p>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

                        {/* Form Fields */}
                        <div className="space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('passwordReset.newPassword', 'New Password')}
                                </label>
                                <InputPassword
                                    name="password"
                                    id="password"
                                    placeholder={t('passwordReset.enterNewPassword', 'Enter new password')}
                                    value={formData.password}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('passwordReset.confirmPassword', 'Confirm Password')}
                                </label>
                                <InputPassword
                                    name="repeatPassword"
                                    id="repeatPassword"
                                    placeholder={t('passwordReset.confirmNewPassword', 'Confirm new password')}
                                    value={formData.repeatPassword}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-700/50 rounded-lg p-4">
                            <div className="flex space-x-3">
                                <svg className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-300">
                                        {t('passwordReset.passwordRequirements', 'Password Requirements')}
                                    </h4>
                                    <ul className="text-xs text-green-800 dark:text-green-400 space-y-1">
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mr-2"></span>
                                            {t('passwordReset.minChars', 'At least 8 characters')}
                                        </li>
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mr-2"></span>
                                            {t('passwordReset.uppercase', 'Uppercase letters (A-Z)')}
                                        </li>
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mr-2"></span>
                                            {t('passwordReset.lowercase', 'Lowercase letters (a-z)')}
                                        </li>
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400 mr-2"></span>
                                            {t('passwordReset.numbers', 'Numbers (0-9)')}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4 pt-4">
                            <div>
                                <Button
                                    type="submit"
                                    label={t('passwordReset.resetPassword', 'Reset Password')}
                                    loading={isLoading}
                                    disabled={isLoading}
                                    className="w-full py-4 text-base font-semibold"
                                    icon={!isLoading ? 'pi pi-check' : undefined}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    label={t('common.backToLogin', 'Back to Login')}
                                    severity="secondary"
                                    onClick={() => navigate('/login')}
                                    disabled={isLoading}
                                    className="w-full py-3"
                                />
                                <Button
                                    type="button"
                                    label={t('common.clearForm', 'Clear')}
                                    severity="info"
                                    onClick={handleResetForm}
                                    disabled={isLoading}
                                    className="w-full py-3"
                                    icon="pi pi-times"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Loading Spinner */}
            {isLoading && <Loader />}
        </>
    )
}

export default ResetPassword