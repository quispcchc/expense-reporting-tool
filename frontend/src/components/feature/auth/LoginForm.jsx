import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import Input from '../../common/ui/Input.jsx'
import InputPassword from '../../common/ui/InputPassword.jsx'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../../common/ui/LanguageSwitcher.jsx'

import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'

function LoginForm() {
    const { t } = useTranslation()
    const { login, error, setError } = useAuth()
    const [formErrors, setFormErrors] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    })

    // On mount, restore saved email if "Remember Me" was previously checked
    useEffect(() => {
        const savedRemember = localStorage.getItem('remember') === 'true'
        if (savedRemember) {
            const savedEmail = localStorage.getItem('email') || ''
            setFormData(prev => ({ ...prev, email: savedEmail, remember: true }))
        }
    }, [])

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleBlur = (e) => {
        const { name, value } = e.target
        if (name === 'email') {
            setFormData(prev => ({ ...prev, email: value.trim() }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setFormErrors([])

        const cleaned = { ...formData, email: formData.email.trim() }
        setFormData(cleaned)

        const validation = validateForm(cleaned, validationSchemas.login)
        setFormErrors(validation.errors)
        if (!validation.isValid) return

        setIsSubmitting(true)
        try {
            const result = await login({
                email: cleaned.email,
                password: cleaned.password,
                remember: cleaned.remember,
            })

            if (result.success) {
                if (formData.remember) {
                    localStorage.setItem('email', formData.email)
                    localStorage.setItem('remember', 'true')
                } else {
                    localStorage.removeItem('email')
                    localStorage.removeItem('remember')
                }
                navigate(result.redirectTo)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-100 p-5" autoComplete="on">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-brand-secondary">CCHC</h2>
                <h3 className="text-lg font-medium text-brand-secondary">Expense Claim Portal</h3>
            </div>
            <div className="mb-6">
                <h3 className="text-xl font-semibold">{t('auth.loginTitle')}</h3>
                <p className="text-sm text-gray-500">{t('auth.loginSubtitle')}</p>
            </div>

            {/* Email */}
            <Input name="email" id="email" label={t('users.email')} placeholder={t('auth.emailPlaceholder')}
                value={formData.email} autoComplete="username"
                onChange={handleFormChange} onBlur={handleBlur} errors={formErrors} />

            {/* Password */}
            <InputPassword name="password" id="password" label={t('auth.password', 'Password')} placeholder={t('auth.passwordPlaceholder')}
                onChange={handleFormChange} autoComplete="current-password"
                value={formData.password} errors={formErrors} />

            {/* Remember & Forget */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <input type="checkbox" name="remember" id="remember" onChange={handleFormChange}
                        className="mr-2" checked={formData.remember} />
                    <label htmlFor="remember">{t('auth.rememberMe')}</label>
                </div>

                <a href="/forgot-password" className="text-primary hover:underline">{t('auth.forgotPassword')}</a>
            </div>

            {/* Server side validation message */}
            {error && <div className="bg-red-100 text-red-600 rounded-xl p-2 mb-6">{error}</div>}
            <Button type="submit" label={t('common.submit')} className="w-full"
                loading={isSubmitting} disabled={isSubmitting} />
        </form>
    )
}

export default LoginForm
