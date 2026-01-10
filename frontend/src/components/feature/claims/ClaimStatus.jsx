import React from 'react'
import StatusTab from '../../common/ui/StatusTab.jsx'

// Display the status of the claim
function ClaimStatus ({curClaim}) {
    return (
        <div className='flex justify-between gap-4'>
            <p className="text-2xl">Status: </p>
            <StatusTab status={ curClaim.claim_status_id}/>
        </div>
    )
}

export default ClaimStatus