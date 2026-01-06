import React, { useState } from 'react'
import ClaimDetailRow from './ClaimDetailRow.jsx'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { Button } from 'primereact/button'
import api from '../../../api/api.js'
import { showToast } from '../../../utils/helpers.js'

// ClaimDetail component shows details of a single claim
// Used in both view and edit claim pages

function ClaimDetail ({ curClaim, toastRef }) {
    const { lookups } = useLookups()
    const [isEditing, setIsEditing] = useState(false)

    const [claimDetail, setClaimDetail] = useState({
        claim_type_id: curClaim.claim_type.claim_type_id,
        team_id: curClaim.team_id,
    })

    function handleSelectChange (field, value) {
        setClaimDetail(prev => ( {
            ...prev,
            [ field ]: value,
        } ))
    }

    async function handleSelectSave () {
        await api.put(`/claims/${ curClaim.claim_id }`, claimDetail)
        showToast(toastRef, { severity: 'success', summary: 'Updated', detail: 'Claim Updated Successfully' })
        setIsEditing(false)


    }

    function getDepartmentName (id) {
        return lookups.claimTypes?.find(c => c.claim_type_id === id)?.claim_type_name
    }

    function getTeamName (id) {
        return lookups.teams?.find(t => t.team_id === id)?.team_name
    }

    return (

        <ComponentContainer>
            <div className="flex justify-between">
                <h5 className="text-[22px] mb-2">Claim Detail</h5>
                <div>
                    { !isEditing && <Button
                        rounded
                        icon="pi pi-pencil"
                        onClick={ () => setIsEditing(prev => !prev) }
                    /> }
                    <div>
                        { isEditing && (
                            <div className="flex gap-2">
                                <Button
                                    rounded
                                    icon="pi pi-check"
                                    onClick={ handleSelectSave }
                                />

                                <Button
                                    icon="pi pi-times"
                                    rounded
                                    text
                                    aria-label="Cancel"
                                    onClick={ () => {
                                        setIsEditing(false)
                                        setClaimDetail({ team_id: curClaim.team_id, claim_type_id: curClaim.claim_type_id })
                                    } }
                                />
                            </div>
                        ) }
                    </div>
                </div>

            </div>

            <p className="text-[#888888] text-sm">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium
                aliquid
                commodi deleniti dolor.</p>

            <table className="table-auto w-full text-left">
                <tbody>
                    {/* Claim Type */ }
                    <ClaimDetailRow
                        title="Claim Type:"
                        value={
                            isEditing
                                ? claimDetail.claim_type_id
                                : getDepartmentName(claimDetail.claim_type_id) ?? curClaim.claimType.claim_type_name
                        }
                        isEdit={ isEditing }
                        options={ lookups.claimTypes?.map(c => ( {
                            label: c.claim_type_name,
                            value: c.claim_type_id,
                        } )) }
                        onChange={ (value) => handleSelectChange('claim_type_id', value) }
                    />

                    <ClaimDetailRow title="Date Submitted:" value={ curClaim.claim_submitted }/>
                    <ClaimDetailRow title="Employee:" value={ curClaim.user.full_name }/>
                    <ClaimDetailRow title="Position:" value={ curClaim.position.position_name }/>
                    <ClaimDetailRow title="Department:" value={ curClaim.department.department_name }/>

                    <ClaimDetailRow
                        title="Team:"
                        value={ isEditing ? claimDetail.team_id : getTeamName(claimDetail.team_id) ??
                            curClaim.team?.team_name }
                        isEdit={ isEditing }
                        options={ lookups.teams.filter(team => team.department_id === curClaim.department_id).map(
                            team => ( { label: team.team_name, value: team.team_id } )) }
                        onChange={ (value) => handleSelectChange('team_id', value) }
                    />
                </tbody>
            </table>

        </ComponentContainer>

    )
}

export default ClaimDetail