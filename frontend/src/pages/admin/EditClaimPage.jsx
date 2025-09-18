import React from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useParams } from 'react-router-dom'
import ClaimDetail from '../../components/feature/claims/ClaimDetail.jsx'
import { useClaims } from '../../contexts/ClaimContext.jsx'
import ClaimNotes from '../../components/feature/claims/addNotes/ClaimNotes.jsx'
import ClaimStatus from '../../components/feature/claims/ClaimStatus.jsx'
import EditableExpansionTable from '../../components/feature/claims/expansionTable/EditableExpansionTable.jsx'

function EditClaimPage () {
    const { claimId } = useParams()
    const { getClaimById } = useClaims()
    const curClaim = getClaimById(claimId)
    console.log(curClaim)

    return (
        <div>
            <div className="flex justify-between items-center flex-wrap">
                <ContentHeader title={ `Claim #${ claimId }` } homePath="/admin"/>
                <ClaimStatus curClaim={ curClaim }/>
            </div>

            <div className="flex flex-wrap gap-5 my-5">
                <div className="flex-1"><ClaimDetail curClaim={ curClaim }/></div>
                <div className="flex-1">
                    <ClaimNotes notes={ curClaim.notes  } curClaim={curClaim}/>
                </div>
            </div>

            <EditableExpansionTable data={curClaim.claimItems} curClaim={curClaim} mode='edit'/>

        </div>
    )
}

export default EditClaimPage