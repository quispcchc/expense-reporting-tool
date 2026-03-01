import React, { useRef, useEffect } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useLocation, useNavigate } from 'react-router-dom'
import { Toast } from 'primereact/toast'
import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'
import { showToast, TOAST_LIFE } from '../../utils/helpers.js'
import { ROLE_NAME, USER_TYPE } from '../../config/constants.js'

function MyClaimPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const toast = useRef(null)
    const toastDisplayed = useRef(false)

    useEffect(() => {
        if (location.state?.flashMessage && !toastDisplayed.current) {
            toastDisplayed.current = true
            showToast(toast, { severity: 'success', summary: t('common.success'), detail: location.state.flashMessage, life: TOAST_LIFE.SUCCESS })
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [location, navigate, t])
    const { authUser } = useAuth()
    const path = authUser.role_name === ROLE_NAME.USER ? '/user' : '/admin'

    return (
        <>
            <Toast ref={toast} />
            <ContentHeader title={t('claims.myClaimsTitle')} homePath={path} iconKey="claims.myClaimsTitle" />
            <ClaimListDataTable path={path} user={USER_TYPE.USER} />
        </>
    )
}

export default MyClaimPage