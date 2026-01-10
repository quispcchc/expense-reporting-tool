import React, { useRef } from 'react'
import CreateClaim from '../../components/feature/claims/CreateClaim.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'


function UserCreateClaimPage() {
    const toast = useRef(null)

    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />
            <CreateClaim navigateTo='/user/claims' homePath='/user/claims' toastRef={toast} />
        </div>

    )
}

export default UserCreateClaimPage