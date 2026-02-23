import { useAuth } from '../../../contexts/AuthContext.jsx'
import { Navigate, useLocation } from 'react-router-dom'
import Unauthorized from '../../../pages/shared/Unauthrized.jsx'
import Loader from '../../common/ui/Loader.jsx'

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { authUser, isAuthenticated,isLoading } = useAuth()
    const location = useLocation()

    // If user is not authenticated, redirect to login page,
    // passing the current location for redirect after login

    if (isLoading) {
        return <Loader />
    }
    
    if (!isAuthenticated()) {
        return (<Navigate to="/login" state={{ from: location }} replace />)
    }

    // If allowedRoles specified, but user's role is not in allowedRoles,
    // render the Unauthorized component with a back navigation option
    if (allowedRoles.length > 0 && !allowedRoles.includes(authUser?.role_name)) {
        return (<Unauthorized requiredRoles={allowedRoles} userRole={authUser?.role} onGoBack={() => window.history.back()}/>)

    }

    return children
}

export default ProtectedRoute