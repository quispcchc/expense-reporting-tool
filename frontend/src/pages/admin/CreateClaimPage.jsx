import React, { useRef } from 'react'
import CreateClaim from '../../components/feature/claims/CreateClaim.jsx'
import { Toast } from 'primereact/toast'

function CreateClaimPage () {
    const toast = useRef()
    return (
        <div>
            <Toast ref={toast}/>
            <CreateClaim navigateTo='/admin/claims' homePath='/admin/claims' toastRef={toast}/>
        </div>

    )
}

export default CreateClaimPage