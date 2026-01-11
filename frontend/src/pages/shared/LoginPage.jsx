import React from 'react'
import LoginForm from '../../components/feature/auth/LoginForm.jsx'
import loginPic from '../../assets/loginPic.png'
import { useAuth } from '../../contexts/AuthContext.jsx'

import { ProgressSpinner } from 'primereact/progressspinner';
import Loader from '../../components/common/ui/Loader.jsx'


function Login() {
    const { isLoading } = useAuth()
    return (
        <div className="min-h-screen flex">
            {/* Left side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-4">
                <div className="w-full max-w-md">
                    <LoginForm />
                </div>
            </div>

            {/* Right side - Image */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                <img
                    src={loginPic}
                    alt="Login illustration"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Optional gradient overlay for better aesthetics */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
            </div>

            {isLoading && (
                <Loader />
            )}
        </div>
    )
}

export default Login
