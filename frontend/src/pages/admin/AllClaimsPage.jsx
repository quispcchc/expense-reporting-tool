import React, { useRef } from 'react'

import { useClaims } from '../../contexts/ClaimContext.jsx'

import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { useAuth } from '../../contexts/AuthContext.jsx'

function AllClaimsPage () {
    const { claims } = useClaims()
    const toast = useRef()

    const { authUser } = useAuth()
    const path = authUser.role_name === 'regular_user' ? '/user' : '/admin'



    return (
        <>
            <Toast ref={toast}/>
            <ConfirmDialog/>
            <p className="text-2xl my-3">Claims</p>
            <ClaimListDataTable claims={claims} user='admin' path={path} toastRef={toast}/>
        </>
    )
}

export default AllClaimsPage