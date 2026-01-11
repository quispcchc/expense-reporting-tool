import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const RootRedirect = () => {
    const { t } = useTranslation()
    const { isAuthenticated, authUser, isLoading } = useAuth()

    if (isLoading) {
        return <div>{t('common.loading')}</div> // Or a proper spinner
    }

    if (isAuthenticated() && authUser) {
        const path = authUser.role_name === 'regular_user' ? '/user' : '/admin'
        return <Navigate to={path} replace />
    }

    return <Navigate to="/login" replace />
}

export default RootRedirect
