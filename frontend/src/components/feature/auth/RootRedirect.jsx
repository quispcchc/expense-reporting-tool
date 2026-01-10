import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'

const RootRedirect = () => {
    const { isAuthenticated, authUser, isLoading } = useAuth()

    if (isLoading) {
        return <div>Loading...</div> // Or a proper spinner
    }

    if (isAuthenticated() && authUser) {
        const path = authUser.role_name === 'regular_user' ? '/user' : '/admin'
        return <Navigate to={path} replace />
    }

    return <Navigate to="/login" replace />
}

export default RootRedirect
