import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../common/layout/Header.jsx'
import { TagProvider } from '../../contexts/TagContext.jsx'

function Layout() {
    return (
        <TagProvider>
            <div className="flex flex-col h-screen">
                <Header />
                <main className="grow px-4 md:px-10 lg:px-40 py-4 md:py-8 bg-bg-secondary overflow-y-auto">
                    <Outlet />
                </main>

            </div>
        </TagProvider>
    )
}

export default Layout