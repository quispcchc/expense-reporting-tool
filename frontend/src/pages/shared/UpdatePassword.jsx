import React, { useState, useRef } from 'react'
import { Button } from 'primereact/button'
import { validationSchemas } from '../../utils/validation/schemas.js'
import { validateForm } from '../../utils/validation/validator.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import InputPassword from '../../components/common/ui/InputPassword.jsx'
import { useNavigate } from 'react-router-dom'
import Loader from '../../components/common/ui/Loader.jsx'
import { useTranslation } from 'react-i18next'
import { Toast } from 'primereact/toast'
import { showToast } from '../../utils/helpers.js'
import LanguageSwitcher from '../../components/common/ui/LanguageSwitcher.jsx'
import ThemeSwitcher from '../../components/common/ui/ThemeSwitcher.jsx'

function UpdatePassword() {
    const { t } = useTranslation()
    const toastRef = useRef(null)
    const navigate = useNavigate()
    
    // Form state
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    })
    const [formErrors, setFormErrors] = useState({})
    const [isUpdateSuccess, setIsUpdateSuccess] = useState(false)
    
    // API state
    const { updatePassword, error: apiError, setError, isLoading } = useAuth()

    /**
     * Navigate back to previous page
     */
    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/dashboard')
        }
    }

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
     * Handle password update form submission
     */
    const handleUpdatePasswordSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        // Validate form inputs
        const schema = validationSchemas.updatePassword
        const validation = validateForm(formData, schema)
        setFormErrors(validation.errors)

        if (!validation.isValid) {
            showToast(toastRef, {
                severity: 'error',
                summary: t('passwordReset.validationError', 'Validation Error'),
                detail: t('passwordReset.pleaseCheckFields', 'Please check your input fields')
            })
            return
        }

        // Call updatePassword API
        const result = await updatePassword(formData)

        if (result?.success) {
            setIsUpdateSuccess(true)
            showToast(toastRef, {
                severity: 'success',
                summary: t('passwordReset.success', 'Success'),
                detail: t('passwordReset.updateSuccess', 'Password updated successfully!')
            })
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/dashboard')
            }, 2000)
        } else {
            setIsUpdateSuccess(false)
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
    const handleResetForm = () => {
        setFormData({
            current_password: '',
            new_password: '',
            new_password_confirmation: '',
        })
        setFormErrors({})
        setIsUpdateSuccess(false)
        setError(null)
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
                    {/* Update Password Form */}
                    <form 
                        onSubmit={handleUpdatePasswordSubmit} 
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6 transition-colors duration-200"
                    >
                        {/* Header with Icon */}
                        <div className="space-y-4 text-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-900/50 mx-auto">
                                <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {t('passwordReset.updatePassword', 'Update Password')}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                    {t('passwordReset.updatePasswordDescription', 'Enter your current password and choose a new one')}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

                        {/* Form Fields */}
                        <div className="space-y-5">
                            {/* Current Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('passwordReset.currentPassword', 'Current Password')}
                                </label>
                                <InputPassword
                                    name="current_password"
                                    id="current_password"
                                    placeholder={t('passwordReset.enterCurrentPassword', 'Enter current password')}
                                    value={formData.current_password}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('passwordReset.newPassword', 'New Password')}
                                </label>
                                <InputPassword
                                    name="new_password"
                                    id="new_password"
                                    placeholder={t('passwordReset.enterNewPassword', 'Enter new password')}
                                    value={formData.new_password}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {t('passwordReset.passwordConfirmation', 'Confirm Password')}
                                </label>
                                <InputPassword
                                    name="new_password_confirmation"
                                    id="new_password_confirmation"
                                    placeholder={t('passwordReset.confirmNewPassword', 'Confirm new password')}
                                    value={formData.new_password_confirmation}
                                    onChange={handleFormChange}
                                    errors={formErrors}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-700/50 rounded-lg p-4">
                            <div className="flex space-x-3">
                                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 7a1 1 0 000 2h6a1 1 0 000-2H8zm0 3a1 1 0 000 2h3a1 1 0 000-2H8z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                                        {t('passwordReset.passwordRequirements', 'Password Requirements')}
                                    </h4>
                                    <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mr-2"></span>
                                            {t('passwordReset.minChars', 'At least 8 characters')}
                                        </li>
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mr-2"></span>
                                            {t('passwordReset.uppercase', 'Uppercase letters (A-Z)')}
                                        </li>
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mr-2"></span>
                                            {t('passwordReset.lowercase', 'Lowercase letters (a-z)')}
                                        </li>
                                        <li className="flex items-center">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mr-2"></span>
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
                                label={t('passwordReset.updatePassword', 'Update Password')}
                                loading={isLoading}
                                disabled={isLoading}
                                className="w-full py-4 text-base font-semibold"
                                icon={!isLoading ? 'pi pi-lock' : undefined}
                            />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    label={t('common.cancel', 'Cancel')}
                                    severity="secondary"
                                    onClick={handleGoBack}
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


export default UpdatePassword