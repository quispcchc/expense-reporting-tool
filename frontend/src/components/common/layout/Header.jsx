import React, { useState, useRef, useEffect } from 'react'
import { IoNotificationsOutline } from 'react-icons/io5'

import { useAuth } from '../../../contexts/AuthContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from 'primereact/avatar'
import { Divider } from 'primereact/divider'
import Loader from '../ui/Loader.jsx'

function Header () {
    const { authUser, logout, isLoading } = useAuth()
    const navigator = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef()

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside (event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])
    const handleLogout = async() => {
        const result = await logout()

        if (result.success) {
            navigator('/login')
        }
    }

    return (
        <div className="h-20 flex justify-end items-center gap-5 p-4 shadow-sm">
            {/* Notification area */ }
            <div className="flex items-center justify-center w-12 h-12 bg-[#F6F6F6] rounded-lg relative">
                <div className="text-2xl"><IoNotificationsOutline/></div>
                <span
                    className="w-4 h-4 bg-red-600 text-white text-xs rounded-sm absolute left-6 top-3 text-center">8</span>
            </div>

            <Divider layout="vertical"/>

            {/* Account info */ }
            <div className="relative" ref={ menuRef }>
                <div className="flex items-center gap-1 mr-8"
                     onClick={ () => setMenuOpen((prev) => !prev) }
                >
                    <Avatar icon="pi pi-user" size="large" shape="circle"/>

                    <div className="p-2">
                        <p className="font-meduim text-sm">{ authUser.full_name }</p>
                        <p className="text-xs text-gray-300">{ authUser.role_name }</p>
                    </div>

                </div>

                { menuOpen && (
                    <ul className="absolute bg-white rounded-lg border border-gray-100 z-10">
                        <li className="px-3 py-2 hover:bg-blue-100 rounded-t-lg">
                            <Link to="/update-password">
                                Reset Password
                            </Link>
                        </li>

                        <li className="px-3 py-2 hover:bg-blue-100 rounded-b-lg"
                            onClick={ handleLogout }>
                            Log out
                        </li>
                    </ul>
                ) }
            </div>

            { isLoading && <Loader/> }
        </div>
    )
}

export default Header