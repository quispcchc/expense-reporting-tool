import React, { useState, useEffect, useMemo } from 'react'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarRightCollapse, TbUsers } from 'react-icons/tb'
import { IoSettingsOutline } from 'react-icons/io5'
import { PiOfficeChair } from 'react-icons/pi'
import { IoDocumentTextOutline, IoCreateOutline } from 'react-icons/io5'
import { BsTag } from 'react-icons/bs'
import { Link, useLocation } from 'react-router-dom'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'

function SideBar() {
    const { t } = useTranslation()
    const location = useLocation()
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebarCollapsed') === 'true'
    })
    const [showMobileMenu, setShowMobileMenu] = useState(false)

    const sidebarData = useMemo(() => [
        {
            title: t('sidebar.claims'),
            items: [
                { icon: IoDocumentTextOutline, label: t('sidebar.allClaims'), path: '/admin/claims' },
                { icon: IoDocumentTextOutline, label: t('sidebar.myClaims', 'My Claims'), path: '/admin/my-claims' },
                { icon: IoCreateOutline, label: t('sidebar.newClaim'), path: '/admin/claims/create-claim' },
            ],
        },
        {
            title: t('sidebar.general'),
            items: [
                { icon: TbUsers, label: t('sidebar.users'), path: '/admin/users' },
                { icon: PiOfficeChair, label: t('sidebar.teams'), path: '/admin/teams' },
                { icon: IoDocumentTextOutline, label: t('sidebar.costCentre'), path: '/admin/cost-centre' },
                { icon: BsTag, label: t('sidebar.tags'), path: '/admin/tags' },
                { icon: IoSettingsOutline, label: t('sidebar.settings'), path: '/admin/settings' },
            ],
        },
    ], [t])

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)

            if (mobile) {
                setShowMobileMenu(false)
            }

        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (isMobile) {
            setShowMobileMenu(false)
        }
    }, [location.pathname, isMobile])

    // Body scroll lock when mobile menu is open
    useEffect(() => {
        if (isMobile && showMobileMenu) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isMobile, showMobileMenu])

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showMobileMenu) {
                setShowMobileMenu(false)
            }
        }

        if (showMobileMenu) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => document.removeEventListener('keydown', handleEscape)
    }, [showMobileMenu])

    const toggleSidebar = () => {
        if (isMobile) {
            setShowMobileMenu(prev => !prev)
        } else {
            setIsCollapsed(prev => {
                localStorage.setItem('sidebarCollapsed', `${!prev}`)
                return !prev
            })
        }
    }

    const closeMobileMenu = () => {
        setShowMobileMenu(false)
    }

    return (
        <>
            {/* Mobile menu icon*/}
            {isMobile && (
                <button
                    onClick={toggleSidebar}
                    className="fixed top-4 left-4 z-50 p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors md:hidden"
                    aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
                    aria-expanded={showMobileMenu}
                >
                    {showMobileMenu ? (
                        <HiX className="w-5 h-5 text-gray-700" />
                    ) : (
                        <HiMenuAlt3 className="w-5 h-5 text-gray-700" />
                    )}
                </button>
            )}

            {/* Mobile menu overlay*/}
            {isMobile && showMobileMenu && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    h-screen bg-white border-gray-200
                    flex flex-col
                    transition-all duration-300 ease-in-out
                    ${isMobile
                        ? `fixed top-0 left-0 z-50 w-80 max-w-[85vw] shadow-xl ${showMobileMenu
                            ? 'translate-x-0'
                            : '-translate-x-full'}`
                        : `shrink-0 ${isCollapsed ? 'w-16' : 'w-55'}`}`}
                role="navigation"
                aria-label="Main navigation"
            >

                <div className={`flex items-center p-4 text-xl mb-5 border-gray-100 flex-shrink-0 
                ${!isMobile && isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {(!isCollapsed || isMobile) && (
                        <div className="leading-tight">
                            <span className="block text-[#184190] font-bold">CCHC</span>
                            <span className="block text-[#184190] font-medium text-sm">{t('auth.appName')}</span>
                        </div>
                    )}

                    {/* Desktop toggle button */}
                    {!isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="text-[#888888] hover:text-[#184190] p-1 rounded hover:bg-gray-100 transition-colors"
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? (
                                <TbLayoutSidebarRightCollapse className="w-5 h-5" />
                            ) : (
                                <TbLayoutSidebarLeftCollapse className="w-5 h-5" />
                            )}
                        </button>
                    )}


                    {/* Mobile close button */}
                    {isMobile && (
                        <button
                            onClick={closeMobileMenu}
                            className="text-[#888888] hover:text-[#184190] p-1 rounded hover:bg-gray-100 transition-colors"
                            aria-label="Close menu"
                        >
                            <HiX className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {sidebarData.map((section, index) => (
                        <div key={index} className="mb-6">
                            {(!isCollapsed || isMobile) && (
                                <h3 className="px-4 py-2 text-sm font-light text-[#1D1B20] uppercase tracking-wider">
                                    {section.title}
                                </h3>
                            )}

                            <ul className="space-y-1">
                                {section.items.map((item, idx) => (
                                    <li key={idx}>
                                        <Link
                                            to={item.path}
                                            onClick={() => isMobile && closeMobileMenu()}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-lg
                                                transition-all duration-200 font-light text-sm
                                                hover:bg-[#D9EDFF] hover:text-[#184190]
                                                ${location.pathname === item.path
                                                    ? 'bg-[#D9EDFF] text-[#184190]'
                                                    : 'text-[#888888]'
                                                }
                                                ${!isMobile && isCollapsed ? 'justify-center px-2' : ''}
                                            ` }
                                            title={!isMobile && isCollapsed ? item.label : ''}
                                            aria-label={item.label}
                                            aria-current={location.pathname === item.path ? 'page' : undefined}
                                        >
                                            <div className="text-xl flex-shrink-0" aria-hidden="true">
                                                <item.icon />
                                            </div>
                                            {(!isCollapsed || isMobile) && (
                                                <span className="truncate">{item.label}</span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    )
}

export default SideBar