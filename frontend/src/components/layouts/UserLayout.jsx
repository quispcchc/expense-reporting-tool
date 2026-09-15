import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../common/layout/Header.jsx'
import SideBar from '../common/layout/SideBar.jsx'
import { TagProvider } from '../../contexts/TagContext.jsx'

function Layout() {
    return (
        <TagProvider>
            <div className="flex h-dvh">
                <SideBar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <Header />
                    <main className="flex-1 py-4 md:py-8 bg-[var(--color-bg-secondary)] overflow-y-auto overflow-x-hidden">
                        <div className="page-container px-3 sm:px-4 md:px-6 lg:px-10">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </TagProvider>
    )
}

export default Layout