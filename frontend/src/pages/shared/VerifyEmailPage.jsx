import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { useRef } from 'react'
import { showToast } from '../../utils/helpers.js'
import api from '../../api/api.js'
import { useTranslation } from 'react-i18next'

function VerifyEmailPage() {
    const { t } = useTranslation()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const toastRef = useRef(null)

    const [formData, setFormData] = useState({
        email: searchParams.get('email') || '',
        token: searchParams.get('token') || '',
        password: '',
        password_confirmation: '',
    })

    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [isAlreadyVerified, setIsAlreadyVerified] = useState(false)

    useEffect(() => {
        const email = searchParams.get('email')
        const token = searchParams.get('token')

        // Check if email and token are provided
        if (!email || !token) {
            showToast(toastRef, {
                severity: 'error',
                summary: 'Error',
                detail: 'Invalid verification link. Please check your email.',
            })
            return
        }

        // Check if email is already verified using the email_verified_at field
        const checkVerificationStatus = async () => {
            try {
                const response = await api.post('/check-email-verification', {
                    email: email,
                })

                if (response.data.is_verified) {
                    setIsAlreadyVerified(true)
                    showToast(toastRef, {
                        severity: 'info',
                        summary: 'Info',
                        detail: response.data.message,
                    })
                }
            } catch (error) {
                // If endpoint fails, continue to show the form
                console.error('Error checking email verification status', error)
            }
        }

        checkVerificationStatus()
    }, [searchParams])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }))
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (!formData.password_confirmation) {
            newErrors.password_confirmation = 'Password confirmation is required'
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleVerifyEmail = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setLoading(true)
        try {
            const response = await api.post('/verify-email', {
                email: formData.email,
                token: formData.token,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            })

            showToast(toastRef, {
                severity: 'success',
                summary: 'Success',
                detail: 'Email verified successfully. Redirecting to login...',
            })

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to verify email'
            
            // Check if email is already verified
            if (error.response?.status === 400 && message.includes('already verified')) {
                setIsAlreadyVerified(true)
                showToast(toastRef, {
                    severity: 'info',
                    summary: 'Info',
                    detail: message,
                })
            } else {
                showToast(toastRef, {
                    severity: 'error',
                    summary: 'Error',
                    detail: message,
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResendEmail = async () => {
        if (!formData.email) {
            showToast(toastRef, {
                severity: 'error',
                summary: 'Error',
                detail: 'Email is required',
            })
            return
        }

        setResendLoading(true)
        try {
            await api.post('/resend-verification-email', {
                email: formData.email,
            })

            showToast(toastRef, {
                severity: 'success',
                summary: 'Success',
                detail: 'Verification email sent successfully. Please check your inbox.',
            })
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to resend email'
            showToast(toastRef, {
                severity: 'error',
                summary: 'Error',
                detail: message,
            })
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Toast ref={toastRef} />

            <Card className="w-full max-w-md">
                {isAlreadyVerified ? (
                    // Already Verified UI
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-green-100 rounded-full p-4">
                                <i className="pi pi-check text-3xl text-green-600"></i>
                            </div>
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Email Already Verified
                            </h1>
                            <p className="text-gray-600">
                                Your email address <span className="font-semibold">{formData.email}</span> is already verified.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                Your account is fully set up and ready to use. You can now log in with your credentials.
                            </p>
                        </div>

                        <Button
                            label="Go to Login"
                            onClick={() => navigate('/login')}
                            className="w-full !h-[44px]"
                            icon="pi pi-sign-in"
                        />
                    </div>
                ) : (
                    // Verification Form UI
                    <>
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
                            <p className="text-gray-600">
                                Set your password to complete your account setup
                            </p>
                        </div>

                        <form onSubmit={handleVerifyEmail} className="space-y-4">
                            {/* Email Display */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Email
                                </label>
                                <InputText
                                    value={formData.email}
                                    disabled
                                    className="w-full"
                                />
                                <small className="text-gray-500">This email has been verified</small>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Password
                                </label>
                                <Password
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    toggleMask
                                    className="w-full"
                                    weakLabel="Too simple"
                                    mediumLabel="Average complexity"
                                    strongLabel="Complex password"
                                    feedback
                                />
                                {errors.password && (
                                    <small className="text-red-600">{errors.password}</small>
                                )}
                            </div>

                            {/* Password Confirmation */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <Password
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    toggleMask
                                    feedback={false}
                                    className="w-full"
                                />
                                {errors.password_confirmation && (
                                    <small className="text-red-600">
                                        {errors.password_confirmation}
                                    </small>
                                )}
                            </div>

                            {/* Verify Button */}
                            <Button
                                type="submit"
                                label={loading ? 'Verifying...' : 'Verify Email & Set Password'}
                                loading={loading}
                                disabled={loading}
                                className="w-full !h-[44px]"
                            />
                        </form>

                        {/* Resend Email Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600 mb-3">
                                Didn't receive the email?
                            </p>
                            <Button
                                type="button"
                                label={resendLoading ? 'Sending...' : 'Resend Verification Email'}
                                onClick={handleResendEmail}
                                loading={resendLoading}
                                disabled={resendLoading}
                                severity="secondary"
                                className="w-full !h-[44px]"
                            />
                        </div>

                        {/* Back to Login */}
                        <div className="mt-4 text-center">
                            <Button
                                type="button"
                                label="Back to Login"
                                onClick={() => navigate('/login')}
                                text
                                severity="secondary"
                            />
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}

export default VerifyEmailPage
