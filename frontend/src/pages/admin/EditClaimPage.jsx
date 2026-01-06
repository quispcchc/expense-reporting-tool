import React, { useEffect, useRef, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useParams } from 'react-router-dom'
import ClaimDetail from '../../components/feature/claims/ClaimDetail.jsx'
import { useClaims } from '../../contexts/ClaimContext.jsx'
import ClaimNotes from '../../components/feature/claims/addNotes/ClaimNotes.jsx'
import ClaimStatus from '../../components/feature/claims/ClaimStatus.jsx'
import EditableExpansionTable from '../../components/feature/claims/expansionTable/EditableExpansionTable.jsx'
import Loader from '../../components/common/ui/Loader.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'

function EditClaimPage () {
    const { claimId } = useParams()
    const { getClaimById } = useClaims()

    const [curClaim, setCurClaim] = useState(null)

    const fetchClaim = async() => {
        try {
            const data = await getClaimById(Number(claimId))
            setCurClaim(data)
        }
        catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchClaim()
    }, [claimId])

    const toast = useRef(null)

    if (!curClaim) return <Loader/>

    return (
        <div>
            <Toast ref={ toast }/>
            <ConfirmDialog/>

            <div className="flex justify-between items-center flex-wrap">
                <ContentHeader title={ `Claim #${ claimId }` } homePath="/admin"/>
                <ClaimStatus curClaim={ curClaim }/>
            </div>

            <div className="flex flex-wrap gap-5 my-5">
                <div className="flex-1"><ClaimDetail curClaim={ curClaim } toastRef={toast}/></div>
                <div className="flex-1">
                    <ClaimNotes curClaim={ curClaim } toastRef={ toast }/>
                </div>
            </div>

            <EditableExpansionTable data={ curClaim.expenses } curClaim={ curClaim } mode="edit" toastRef={ toast }
                                    onClaimUpdated={ fetchClaim }
            />

        </div>
    )
}

export default EditClaimPage