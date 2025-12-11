import React, { useRef } from 'react'

import { useClaims } from '../../contexts/ClaimContext.jsx'

import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'

function AllClaimsPage () {
    const { claims } = useClaims()
    const toast = useRef()
    console.log('claims',claims)


    return (
        <>
            <Toast ref={toast}/>
            <ConfirmDialog/>
            <p className="text-2xl my-3">Claims</p>
            <ClaimListDataTable claims={claims} user='admin' toastRef={toast}/>
        </>
    )
}

export default AllClaimsPage