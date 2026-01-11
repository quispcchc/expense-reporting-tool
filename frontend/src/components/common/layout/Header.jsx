import React, { useState, useRef, useEffect } from 'react'
import { IoNotificationsOutline } from 'react-icons/io5'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../../../contexts/AuthContext.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from 'primereact/avatar'
import { Divider } from 'primereact/divider'
import Loader from '../ui/Loader.jsx'
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx'
import ThemeSwitcher from '../ui/ThemeSwitcher.jsx'

function Header() {
    const { t } = useTranslation()
    const { authUser, logout, isLoading } = useAuth()
    const navigator = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef()

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])
    const handleLogout = async () => {
        const result = await logout()

        if (result.success) {
            navigator('/login')
        }
    }

    return (
        <div className="h-20 flex justify-end items-center gap-2 md:gap-4 p-4 shadow-sm bg-[var(--color-bg-primary)]">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notification area */}
            <div className={`flex items-center justify-center w-12 h-12 rounded-lg relative ${'bg-bg-secondary'}`}>
                <div className="text-2xl"><IoNotificationsOutline /></div>
                <span
                    className="w-4 h-4 bg-red-600 text-white text-xs rounded-sm absolute left-6 top-3 text-center">8</span>
            </div>

            <Divider layout="vertical" className="hidden md:block" />

            {/* Account info */}
            <div className="relative" ref={menuRef}>
                <div className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setMenuOpen((prev) => !prev)}
                >
                    <Avatar icon="pi pi-user" size="large" shape="circle" />

                    {/* Hide user name on mobile */}
                    <div className="p-2 hidden md:block">
                        <p className="font-medium text-sm">{authUser.full_name}</p>
                        <p className="text-xs text-gray-300">{authUser.role_name}</p>
                    </div>

                </div>

                {menuOpen && (
                    <ul className="absolute right-0 bg-white rounded-lg border border-gray-100 z-10 min-w-40">
                        <li className="px-3 py-2 hover:bg-blue-100 rounded-t-lg">
                            <Link to="/update-password">
                                {t('auth.resetPassword')}
                            </Link>
                        </li>

                        <li className="px-3 py-2 hover:bg-blue-100 rounded-b-lg cursor-pointer"
                            onClick={handleLogout}>
                            {t('auth.logout')}
                        </li>
                    </ul>
                )}
            </div>

            {isLoading && <Loader />}
        </div>
    )
}

export default Header
