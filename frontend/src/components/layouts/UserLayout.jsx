import React from 'react'
import {Outlet} from 'react-router-dom'
import Header from '../common/layout/Header.jsx'

function Layout () {
    return (
        <div className="flex flex-col h-screen">
            <Header/>
            <main className="grow px-40 py-8 bg-[#F8F8F8]">
                <Outlet/>
            </main>

        </div>
    )
}

export default Layout