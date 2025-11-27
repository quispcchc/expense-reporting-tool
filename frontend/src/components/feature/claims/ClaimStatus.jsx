import React from 'react'
import StatusTab from '../../common/ui/StatusTab.jsx'

// Display the status of the claim
function ClaimStatus ({curClaim}) {
    console.log('curclaim',curClaim)
    return (
        <div className='flex justify-between gap-4'>
            <p className="text-2xl">Status: </p>
            <StatusTab status={ curClaim.status.claim_status_name}/>
        </div>
    )
}

export default ClaimStatus