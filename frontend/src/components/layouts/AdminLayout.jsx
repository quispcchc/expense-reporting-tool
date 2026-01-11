import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from '../common/layout/SideBar.jsx'
import Header from '../common/layout/Header.jsx'

function Layout({ children }) {
    return (
        <div className="flex h-screen">
            <SideBar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 px-6 py-8 bg-[var(--color-bg-secondary)] overflow-auto md:px-10">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout