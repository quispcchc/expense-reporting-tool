import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useClaims } from '../../contexts/ClaimContext.jsx'

import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { useAuth } from '../../contexts/AuthContext.jsx'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { ROLE_NAME, USER_TYPE } from '../../config/constants.js'

function AllClaimsPage() {
    const { t } = useTranslation()
    const { claims } = useClaims()
    const toast = useRef()

    const { authUser } = useAuth()
    const path = authUser.role_name === ROLE_NAME.USER ? '/user' : '/admin'



    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />
            <ContentHeader title={t('claims.allClaimsTitle')} homePath={path} iconKey="claims.allClaimsTitle" />
            <ClaimListDataTable claims={claims} user={USER_TYPE.ADMIN} path={path} toastRef={toast} />
        </>
    )
}

export default AllClaimsPage