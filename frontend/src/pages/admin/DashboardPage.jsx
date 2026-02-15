import React from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useTranslation } from 'react-i18next'

function DashboardPage() {
    const { t } = useTranslation()

    return (
        <>
            {/* Page title/header */}
            <ContentHeader
                title={t('dashboard.title', 'Dashboard')}
                homePath="/admin"
                iconKey="sidebar.dashboard"
            />

            {/* Main content area */}
            <div className="bg-white rounded-xl p-4 md:p-8 mt-5 text-center">
                <div className="flex flex-col items-center justify-center min-h-96">
                    <div className="mb-6">
                        <span className="text-6xl text-gray-300">
                            <i className="pi pi-exclamation-circle"></i>
                        </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                        {t('common.underConstruction', 'Under Construction')}
                    </h2>
                    <p className="text-gray-500">
                        {t('common.comingSoon', 'This page is still under construction. Please check back soon!')}
                    </p>
                </div>
            </div>
        </>
    )
}

export default DashboardPage
