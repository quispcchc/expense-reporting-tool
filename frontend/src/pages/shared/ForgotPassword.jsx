import React, { useState, useEffect } from 'react'
import Input from '../../components/common/ui/Input.jsx'
import { Button } from 'primereact/button'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { validateForm } from '../../utils/validation/validator.js'
import { validationSchemas } from '../../utils/validation/schemas.js'
import { Link } from 'react-router-dom'
import Loader from '../../components/common/ui/Loader.jsx'

function ForgotPassword (props) {
    const [email, setEmail] = useState('')
    const [isLinkSent, setIsLinkSent] = useState()
    const { forgetPassword, error,isLoading } = useAuth()
    const [emailError, setEmailError] = useState()
    const [resetInfo, setResetInfo] = useState({})

    const handleVerifyEmail = async(e) => {
        e.preventDefault()

        // Validate email input using predefined validation schema
        const schema = validationSchemas.forgotPassword
        const validation = validateForm({ email }, schema)
        setEmailError(validation.errors)

        // If validation passes, call forgetPassword API function
        if (validation.isValid) {
            const result = await forgetPassword(email)

            if (result.success) {
                setIsLinkSent(true)
            } else {
                setIsLinkSent(false)
            }

            setResetInfo(result)
            console.log(result)
        }

    }

    return (
        <div className="flex justify-center items-center h-screen">
            <form onSubmit={ handleVerifyEmail } className="flex flex-col gap-3 bg-gray-200/30 p-10 rounded-lg w-100">
                <div>
                    <p className="text-2xl">Forgot your password</p>
                    <p className="text-sm my-3">Please enter the email address you'd like your password reset link sent
                        to </p>
                </div>
                <Input name="email" id="email" label="Please enter email address" onChange={ (e) => setEmail(e.target.value) }
                       errors={ emailError }/>

                <Button type="Submit" label="Request Reset Link"/>
                <a href="/login" className='text-center'>Back To Login</a>

                {/* Display error message if API call fails */}
                { error && <div className="bg-red-100 text-red-600 rounded-xl p-2 mt-6">{ error }</div> }

                {/* Display success message when reset link is sent */}
                { isLinkSent &&
                    <div>
                    <div className="bg-green-100 text-green-600 rounded-xl p-2 mt-6">Reset Password
                        Link Sent Successfully!</div>
                        <Link to={ `/reset-password?email=${encodeURIComponent(resetInfo.email)}&token=${encodeURIComponent(resetInfo.token)}`
                        }>Click me to reset your password</Link>
                    </div>
                }

            </form>
            {isLoading && <Loader/>}
        </div>
    )
}

export default ForgotPassword