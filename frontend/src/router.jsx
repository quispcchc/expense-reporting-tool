import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/shared/LoginPage.jsx'
import ForgotPassword from './pages/shared/ForgotPassword.jsx'
import ResetPassword from './pages/shared/ResetPassword.jsx'
import UpdatePassword from './pages/shared/UpdatePassword.jsx'
import Unauthorized from './pages/shared/Unauthrized.jsx'
import ProtectedRoute from './components/feature/auth/ProtectedRoute.jsx'
import UserLayout from './components/layouts/UserLayout.jsx'
import MyClaimPage from './pages/user/MyClaimPage.jsx'
import CreateClaimPage from './pages/admin/CreateClaimPage.jsx'
import ViewClaimPage from './pages/user/ViewClaimPage.jsx'
import NotFound from './pages/shared/NotFound.jsx'
import AdminLayout from './components/layouts/AdminLayout.jsx'
import AllClaimsPage from './pages/admin/AllClaimsPage.jsx'
import EditClaimPage from './pages/admin/EditClaimPage.jsx'
import UsersPage from './pages/admin/UsersPage.jsx'
import TeamsPage from './pages/admin/TeamsPage.jsx'
import CostCentresPage from './pages/admin/CostCentresPage.jsx'
import TagsPage from './pages/admin/TagsPage.jsx'
import SettingsPage from './pages/admin/SettingsPage.jsx'
import { UserProvider } from './contexts/UserContext.jsx'
import { TeamProvider } from './contexts/TeamContext.jsx'
import { CostCentreProvider } from './contexts/CostCentreContext.jsx'
import UserCreateClaimPage from './pages/user/UserCreateClaimPage.jsx'


const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <Navigate to="/login"/>,
        },
        {
            path: '/login',
            element: <LoginPage/>,
        },
        {
            path: '/forgot-password',
            element: <ForgotPassword/>,
        },
        {
            path: '/reset-password',
            element: <ResetPassword/>,
        },
        {
            path: '/update-password',
            element: <UpdatePassword/>,
        },
        {
            path: '/unauthorized',
            element: <Unauthorized/>,
        },
        {
            path: '/user',
            element: (
                <ProtectedRoute allowedRoles={ ['regular_user','super_admin', 'admin', 'approver'] }>
                    <UserLayout/>
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Navigate to="claims" replace/>,
                },
                {
                    path: 'claims',
                    element: <MyClaimPage/>,
                },
                {
                    path: 'claims/create-claim',
                    element: <UserCreateClaimPage/>,
                },
                {
                    path: 'claims/:claimId/view-claim',
                    element: <ViewClaimPage/>,
                },
                {
                    path: '*',
                    element: <NotFound/>,
                },
            ],
        },
        {
            path: '/admin',
            element: (
                <ProtectedRoute allowedRoles={ ['super_admin', 'admin', 'approver'] }>
                    <AdminLayout/>
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Navigate to="claims" replace/>,
                },
                {
                    path: 'claims',
                    element: <AllClaimsPage/>,
                },
                {
                    path: 'my-claims',
                    element: <MyClaimPage/>,
                },
                {
                    path: 'claims/create-claim',
                    element: <CreateClaimPage/>,
                },
                {
                    path: 'claims/:claimId/edit-claim',
                    element: <EditClaimPage/>,
                },
                {
                    path: 'my-claims/:claimId/view-claim',
                    element: <ViewClaimPage/>,
                },
                {
                    path: 'users',
                    element: <UserProvider><UsersPage/></UserProvider>,
                },
                {
                    path: 'teams',
                    element: <TeamProvider><TeamsPage/></TeamProvider> ,
                },
                {
                    path: 'cost-centre',
                    element: <CostCentreProvider><CostCentresPage/></CostCentreProvider> ,
                },
                {
                    path: 'tags',
                    element: <TagsPage/>,
                },
                {
                    path: 'settings',
                    element: <SettingsPage/>,
                },
                {
                    path: '*',
                    element: <NotFound/>,
                },
            ],
        },
        {
            path: '*',
            element: <NotFound/>,
        },
    ],
)

export default router