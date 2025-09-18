import React from 'react'
import { useClaims } from '../../contexts/ClaimContext.jsx'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import ClaimListDataTable from '../../components/feature/claims/ClaimListDataTable.jsx'

function MyClaimPage () {
    const { claims } = useClaims()

    return (
        <>
            <p className="text-2xl my-3">Claims</p>
            <ContentHeader homePath="/user"/>
         <ClaimListDataTable claims={claims} user='user'/>
        </>
    )
}

export default MyClaimPage