import React from 'react'
import LoginForm from '../../components/feature/auth/LoginForm.jsx'
import loginPic from '../../assets/loginPic.png'
import {useAuth} from '../../contexts/AuthContext.jsx'

import { ProgressSpinner } from 'primereact/progressspinner';
import Loader from '../../components/common/ui/Loader.jsx'


function Login () {
    const {isLoading} = useAuth()
    return (
        <div className="min-h-screen grid grid-cols-1 sm:grid-cols-2">
            {/* Left side - Form */ }
            <div className="flex items-center justify-center">
                <LoginForm/>
            </div>

            {/* Right side - Image */ }
            <div className="hidden sm:block">
                <img
                    src={ loginPic }
                    alt="Login Picture"
                    className="h-screen w-full"
                />
            </div>

            {isLoading && (
               <Loader/>
            )}
        </div>
    )
}

export default Login
