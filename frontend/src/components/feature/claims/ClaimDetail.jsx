import React from 'react'
import ClaimDetailRow from './ClaimDetailRow.jsx'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'

// ClaimDetail component shows details of a single claim
// Used in both view and edit claim pages
function ClaimDetail ({ curClaim }) {
    return (

        <ComponentContainer title='Claim Detail'>
            <p className="text-[#888888] text-sm">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium
                aliquid
                commodi deleniti dolor.</p>

            <table className="table-auto w-full text-left">
                <tbody>
                    <ClaimDetailRow title="Claim type:" value={ curClaim.claimType }/>
                    <ClaimDetailRow title="Date submitted:" value={ curClaim.createdAt || curClaim.dateSubmitted }/>
                    <ClaimDetailRow title="Employee:" value={ curClaim.employeeName }/>
                    <ClaimDetailRow title="Position:" value={ curClaim.position }/>
                    <ClaimDetailRow title="Team:" value={ curClaim.team }/>
                </tbody>
            </table>
        </ComponentContainer>

    )
}

export default ClaimDetail