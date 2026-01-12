import React from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'
import { useClaims } from '../../contexts/ClaimContext.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'

function MyClaimPage() {
    const { t } = useTranslation()
    const { myClaims } = useClaims()
    const { authUser } = useAuth()
    const path = authUser.role_name === 'regular_user' ? '/user' : '/admin'

    return (
        <>
            <ContentHeader title={t('claims.myClaimsTitle')} homePath={path} iconKey="claims.myClaimsTitle" />
            <ClaimListDataTable claims={myClaims} path={path} user='user' />
        </>
    )
}

export default MyClaimPage