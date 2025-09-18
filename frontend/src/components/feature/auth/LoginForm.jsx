import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import Input from '../../common/ui/Input.jsx'
import InputPassword from '../../common/ui/InputPassword.jsx'

import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'

function LoginForm () {
    const { login, error, setError } = useAuth()
    const [formErrors, setFormErrors] = useState([])
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    })

    // On component mount, load saved email/password if "remember me" was checked
    useEffect(() => {
        const savedEmail = localStorage.getItem('email') || ''
        const savedPassword = localStorage.getItem('password') || ''
        const savedRemember = localStorage.getItem('remember') === 'true'

        setFormData(prev => (
            {
                ...prev,
                email: savedEmail,
                password: savedPassword,
                remember: savedRemember,
            } ))
    }, [])

    // Save or clear saved credentials based on "remember me" checkbox
    const rememberEmailAndPassword = () => {
        if (formData.remember) {
            localStorage.setItem('email', formData.email)
            localStorage.setItem('password', formData.password)
            localStorage.setItem('remember', 'true')

        } else {
            localStorage.removeItem('email')
            localStorage.removeItem('password')

        }
    }

    // Handle form field changes (email, password, remember)
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ( {
            ...prev,
            [ name ]: type === 'checkbox' ? checked : value,
        } ))
    }

    const handleSubmit = async(e) => {
        e.preventDefault()
        setError(null)      // Clear server-side errors
        setFormErrors([])   // Clear client-side validation errors

        // Validate form data locally using schema
        const schema = validationSchemas.login
        const validation = validateForm(formData, schema)
        setFormErrors(validation.errors)

        // Clear client-side validation errors
        rememberEmailAndPassword()

        // If validation passed, attempt login
        if (validation.isValid) {
            const result = await login({
                email: formData.email,
                password: formData.password,
            })

            if (result.success) {
                navigate(result.redirectTo)
            }
        }

    }

    return (
        <form onSubmit={ handleSubmit } className="w-100 p-5">
            <h2 className="text-2xl font-bold text-[#05589B] mb-6">My APP</h2>
            <div className="mb-6">
                <h3 className="text-xl font-semibold">Login to Your Account</h3>
                <p className="text-sm text-gray-500">Enter your email address to get started.</p>
            </div>

            {/* Email */ }
            <Input name="email" id="email" label="Email" placeholder="Please enter your email"
                   value={ formData.email }
                   onChange={ handleFormChange } errors={ formErrors }/>

            {/* Password */ }
            <InputPassword name="password" id="password" label="password" placeholder="Please enter your password"
                           onChange={ handleFormChange }
                           value={ formData.password } errors={ formErrors }/>

            {/* Remember & Forget */ }
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <input type="checkbox" name="remember" id="remember" onChange={ handleFormChange }
                           className="mr-2" checked={ formData.remember }/>
                    <label htmlFor="remember">Remember me?</label>
                </div>

                <a href="/forgot-password" className="text-primary hover:underline">Forgot Password?</a>
            </div>

            {/* Server side validation message */ }
            { error && <div className="bg-red-100 text-red-600 rounded-xl p-2 mb-6">{ error }</div> }
            <Button type="submit" label="Submit" className="w-full"/>
        </form>
    )
}

export default LoginForm
