import React from 'react'
import { ProjectProvider } from '../../contexts/ProjectContext.jsx'
import { TagProvider } from '../../contexts/TagContext.jsx'
import { UserProvider } from '../../contexts/UserContext.jsx'
import { DepartmentProvider } from '../../contexts/DepartmentContext.jsx'
import { TeamProvider } from '../../contexts/TeamContext.jsx'
import { CostCentreProvider } from '../../contexts/CostCentreContext.jsx'
import { AccountNumberProvider } from '../../contexts/AccountNumberContext.jsx'
import { Outlet } from 'react-router-dom'
import SideBar from '../common/layout/SideBar.jsx'
import Header from '../common/layout/Header.jsx'

function Layout({ children }) {
    return (
        <ProjectProvider>
            <TagProvider>
                <UserProvider>
                    <DepartmentProvider>
                        <TeamProvider>
                            <CostCentreProvider>
                                <AccountNumberProvider>
                                    <div className="flex h-screen">
                                        <SideBar />
                                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                            <Header />
                                            <main className="flex-1 px-3 py-4 md:py-8 bg-[var(--color-bg-secondary)] overflow-auto sm:px-4 md:px-6 lg:px-10">
                                                <Outlet />
                                            </main>
                                        </div>
                                    </div>
                                </AccountNumberProvider>
                            </CostCentreProvider>
                        </TeamProvider>
                    </DepartmentProvider>
                </UserProvider>
            </TagProvider>
        </ProjectProvider>
    )
}

export default Layout