import { createBrowserRouter, Navigate } from 'react-router-dom'
import LoginPage from './pages/shared/LoginPage.jsx'
import ForgotPassword from './pages/shared/ForgotPassword.jsx'
import ResetPassword from './pages/shared/ResetPassword.jsx'
import UpdatePassword from './pages/shared/UpdatePassword.jsx'
import VerifyEmailPage from './pages/shared/VerifyEmailPage.jsx'
import Unauthorized from './pages/shared/Unauthorized.jsx'
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
import DepartmentsPage from './pages/admin/DepartmentsPage.jsx'
import DepartmentTeamsPage from './pages/admin/DepartmentTeamsPage.jsx'
import CostCentresPage from './pages/admin/CostCentresPage.jsx'
import AccountNumbersPage from './pages/admin/AccountNumbersPage.jsx'
import TagsPage from './pages/admin/TagsPage.jsx'
import SettingsPage from './pages/admin/SettingsPage.jsx'
import UserCreateClaimPage from './pages/user/UserCreateClaimPage.jsx'
import RootRedirect from './components/feature/auth/RootRedirect.jsx'
import DashboardPage from './pages/admin/DashboardPage.jsx'
import { ROLE_NAME } from './config/constants.js'

const router = createBrowserRouter(
    [
        {
            path: '/',
            element: <RootRedirect />,
        },
        {
            path: '/login',
            element: <LoginPage />,
        },
        {
            path: '/forgot-password',
            element: <ForgotPassword />,
        },
        {
            path: '/reset-password',
            element: <ResetPassword />,
        },
        {
            path: '/update-password',
            element: <UpdatePassword />,
        },
        {
            path: '/verify-email',
            element: <VerifyEmailPage />,
        },
        {
            path: '/unauthorized',
            element: <Unauthorized />,
        },
        {
            path: '/user',
            element: (
                <ProtectedRoute allowedRoles={[ROLE_NAME.USER, ROLE_NAME.SUPER_ADMIN, ROLE_NAME.ADMIN, ROLE_NAME.APPROVER]}>
                    <UserLayout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Navigate to="claims" replace />,
                },
                {
                    path: 'claims',
                    element: <MyClaimPage />,
                },
                {
                    path: 'claims/create-claim',
                    element: <UserCreateClaimPage />,
                },
                {
                    path: 'claims/:claimId/view-claim',
                    element: <ViewClaimPage />,
                },
                {
                    path: '*',
                    element: <NotFound />,
                },
            ],
        },
        {
            path: '/admin',
            element: (
                <ProtectedRoute allowedRoles={[ROLE_NAME.SUPER_ADMIN, ROLE_NAME.ADMIN, ROLE_NAME.APPROVER]}>
                    <AdminLayout />
                </ProtectedRoute>
            ),
            children: [
                {
                    index: true,
                    element: <Navigate to="claims" replace />,
                },
                {
                    path: 'claims',
                    element: <AllClaimsPage />,
                },
                {
                    path: 'my-claims',
                    element: <MyClaimPage />,
                },
                {
                    path: 'claims/create-claim',
                    element: <CreateClaimPage />,
                },
                {
                    path: 'claims/:claimId/edit-claim',
                    element: <EditClaimPage />,
                },
                {
                    path: 'my-claims/:claimId/view-claim',
                    element: <ViewClaimPage />,
                },
                {
                    path: 'users',
                    element: <UsersPage />,
                },
                {
                    path: 'departments',
                    element: <DepartmentsPage />,
                },
                {
                    path: 'departments/:departmentId/teams',
                    element: <DepartmentTeamsPage />,
                },
                {
                    path: 'cost-centre',
                    element: <CostCentresPage />,
                },
                {
                    path: 'account-numbers',
                    element: <AccountNumbersPage />,
                },
                {
                    path: 'tags',
                    element: <TagsPage />,
                },
                {
                    path: 'settings',
                    element: <SettingsPage />,
                },
                {
                    path: 'dashboard',
                    element: <DashboardPage />
                },
                {
                    path: '*',
                    element: <NotFound />,
                },
            ],
        },
        {
            path: '*',
            element: <NotFound />,
        },
    ],
)

export default router