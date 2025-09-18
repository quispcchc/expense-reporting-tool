import React, { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { validationSchemas } from '../../utils/validation/schemas.js'
import { validateForm } from '../../utils/validation/validator.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import InputPassword from '../../components/common/ui/InputPassword.jsx'
import { useNavigate } from 'react-router-dom'
import Loader from '../../components/common/ui/Loader.jsx'

function UpdatePassword (props) {
    const [formErrors, setFormErrors] = useState([])
    const navigate = useNavigate()
    const [isUpdateSuccess, setIsUpdateSuccess] = useState(false)
    const { updatePassword, error, setError,isLoading } = useAuth()

    // State to hold form input values for password update
    const [updatePasswordForm, setUpdatePasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    })

    // Handler for navigating back: uses history if possible, else goes home
    const goBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
            console.log('he;;p')
        } else {
            navigate('/')
        }
    }

    // Handler to update form state on input change
    const handleFormChange = (e) => {
        const { value, name } = e.target
        setUpdatePasswordForm(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    // Handler to submit the update password form
    const handleUpdatePasswordSubmit = async(e) => {
        e.preventDefault()
        setError(null)

        // Validate form inputs using predefined schema
        const schema = validationSchemas.updatePassword
        const validation = validateForm(updatePasswordForm, schema)
        setFormErrors(validation.errors)

        if (validation.isValid) {
            // Call updatePassword from auth context with form data
            const result = await updatePassword(updatePasswordForm)

            if (result.success) {
                setIsUpdateSuccess(true)
                navigate('/login')
            } else {
                setIsUpdateSuccess(false)
            }
        }
    }

    return (
        <div className="flex justify-center items-center h-screen">
            <form onSubmit={ handleUpdatePasswordSubmit } className='bg-gray-200/30 p-10 rounded-lg'>
                <p className="text-3xl text-center mb-5">Update Password</p>

                {/* Password input fields with validation error support */}
                <InputPassword name="current_password" id="current_password" label="Current Password"
                               onChange={ handleFormChange } value={ updatePasswordForm.current_password }
                               placeholder="Please enter current password" errors={ formErrors }/>
                <InputPassword name="new_password" id="new_password" label="New Password" onChange={ handleFormChange }
                               value={ updatePasswordForm.new_password } errors={ formErrors } placeholder="Please enter new password"/>
                <InputPassword name="new_password_confirmation" id="new_password_confirmation"
                               label="Password Confirmation"
                               onChange={ handleFormChange } value={ updatePasswordForm.new_password_confirmation }
                               errors={ formErrors } placeholder="Please confirm new password"/>
                <div className="flex gap-3">
                    <Button type="Submit" label="Update Password"/>
                    <Button type="button" label="Go back" onClick={ goBack }/>
                </div>

                {/* Display error or success messages */}
                { error && <div className="bg-red-100 text-red-600 rounded-xl p-2 mt-6">{ error }</div> }
                { isUpdateSuccess &&
                    <div className="bg-green-100 text-green-600 rounded-xl p-2 mt-6">Update Password
                        Successfully!</div> }
            </form>

            {/* Show loading spinner when waiting for async update */}
            {isLoading && <Loader/>}
        </div>
    )
}

export default UpdatePassword