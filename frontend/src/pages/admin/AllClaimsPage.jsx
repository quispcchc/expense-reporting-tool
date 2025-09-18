import React from 'react'

import { useClaims } from '../../contexts/ClaimContext.jsx'

import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'

function AllClaimsPage () {
    const { claims } = useClaims()


    return (
        <>
            <p className="text-2xl my-3">Claims</p>
            <ClaimListDataTable claims={claims} user='admin'/>
        </>
    )
}

export default AllClaimsPage