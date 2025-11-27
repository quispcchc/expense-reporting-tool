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
                    <ClaimDetailRow title="Claim type:" value={ curClaim.claim_type.claim_type_name }/>
                    <ClaimDetailRow title="Date submitted:" value={ curClaim.claim_submitted}/>
                    <ClaimDetailRow title="Employee:" value={ curClaim.user.full_name }/>
                    <ClaimDetailRow title="Position:" value={ curClaim.position.position_name}/>
                    <ClaimDetailRow title="Department:" value={ curClaim.department.department_name }/>
                    <ClaimDetailRow title="Team:" value={ curClaim.team.team_name }/>
                </tbody>
            </table>
        </ComponentContainer>

    )
}

export default ClaimDetail