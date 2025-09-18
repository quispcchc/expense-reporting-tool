import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { validationSchemas } from '../../utils/validation/schemas.js'
import { validateForm } from '../../utils/validation/validator.js'
import InputPassword from '../../components/common/ui/InputPassword.jsx'
import { useNavigate,useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'

function ResetPassword (props) {
    const navigate = useNavigate()
    const [errors, setErrors] = useState([])
    const {resetPassword} = useAuth()

    const [resetPasswordForm, setResetPasswordForm] = useState({
        password: '',
        repeatPassword: '',
    })

    const query = new URLSearchParams(useLocation().search)
    const emailFromQuery = query.get('email')
    const tokenFromQuery = query.get('token')

    const handleFormChange = (e) => {
        const { value, name } = e.target
        setResetPasswordForm(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()

        // Validate form inputs based on schema
        const schema = validationSchemas.resetPassword
        const validation = validateForm(resetPasswordForm, schema)
        setErrors(validation.errors)

        if (validation.isValid) {
            // Call API to reset password if validation past
            await resetPassword({
                email:emailFromQuery,
                token:tokenFromQuery,
                password:resetPasswordForm.password,
                password_confirmation:resetPasswordForm.repeatPassword})
        }

    }

    return (
        <form className="px-40 py-10" onSubmit={ handlePasswordSubmit }>
            <p className="text-3xl text-center mb-10">Reset Password</p>
            <InputPassword label="Password" name="password" id="password" value={ resetPasswordForm.password }
                           onChange={ handleFormChange } errors={ errors }/>

            <InputPassword  label="Repeat Password" name="repeatPassword" id="repeatPassword"
                            value={ resetPasswordForm.repeatPassword } onChange={ handleFormChange } errors={ errors }/>
            <div className='flex gap-3'>
                <Button label="Reset Password" type="submit"/>
                <Button label="Back to login" type='button' onClick={()=>navigate('/login')}/>
            </div>

        </form>
    )
}

export default ResetPassword