import React, { useState } from 'react'
import ClaimDetailRow from './ClaimDetailRow.jsx'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { Button } from 'primereact/button'
import api from '../../../api/api.js'
import { showToast } from '../../../utils/helpers.js'
import { useTranslation } from 'react-i18next'
import MileageByClaim from '../mileage/MileageByClaim.jsx'

// ClaimDetail component shows details of a single claim
// Used in both view and edit claim pages

function ClaimDetail({ curClaim, toastRef, onClaimRefetch }) {
    const { t } = useTranslation()
    const { lookups } = useLookups()
    const [isEditing, setIsEditing] = useState(false)

    const [claimDetail, setClaimDetail] = useState({
        claim_type_id: curClaim.claim_type.claim_type_id,
        team_id: curClaim.team_id,
    })

    function handleSelectChange(field, value) {
        setClaimDetail(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    async function handleSelectSave() {
        try {
            await api.put(`/claims/${curClaim.claim_id}`, claimDetail)

            // Fetch fresh claim data from server
            if (onClaimRefetch) {
                await onClaimRefetch()
            }

            showToast(toastRef, { severity: 'success', summary: 'Updated', detail: 'Claim Updated Successfully' })
            setIsEditing(false)
        } catch (error) {
            showToast(toastRef, { severity: 'error', summary: 'Error', detail: 'Failed to update claim' })
        }
    }

    function getDepartmentName(id) {
        return lookups.claimTypes?.find(c => c.claim_type_id === id)?.claim_type_name
    }

    function getTeamName(id) {
        return lookups.teams?.find(t => t.team_id === id)?.team_name
    }

    // Safe getter for claimType with null checks
    const claimTypeName = curClaim?.claim_type?.claim_type_name || curClaim?.claimType?.claim_type_name
    const position = curClaim?.user?.position?.position_name || curClaim?.position?.position_name
    const department = curClaim?.user?.department?.dept_name || curClaim?.department?.department_name
    const teamName = curClaim?.user?.team?.team_name || curClaim?.team?.team_name
    const fullName = curClaim?.user?.user_full_name || curClaim?.user?.full_name
    const submittedDate = curClaim?.date_submitted || curClaim?.claim_submitted

    return (
        <>
        <ComponentContainer>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h5 className="text-xl font-semibold text-gray-800 mb-1">{t('claims.claimDetails')}</h5>
                    <p className="text-sm text-gray-500">{t('claims.claimDetailDescription', 'View and manage the details of this expense claim submission.')}</p>
                </div>
                <div className="flex gap-2">
                    {!isEditing && <Button
                        rounded
                        icon="pi pi-pencil"
                        onClick={() => setIsEditing(prev => !prev)}
                    />}
                    <div>
                        {isEditing && (
                            <div className="flex gap-2">
                                <Button
                                    rounded
                                    icon="pi pi-check"
                                    onClick={handleSelectSave}
                                />

                                <Button
                                    icon="pi pi-times"
                                    rounded
                                    text
                                    aria-label={t('common.cancel')}
                                    onClick={() => {
                                        setIsEditing(false)
                                        setClaimDetail({ team_id: curClaim.team_id, claim_type_id: curClaim.claim_type_id })
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <table className="table-fixed w-full text-left">
                <colgroup>
                    <col className="w-[120px] md:w-[160px]" />
                    <col />
                </colgroup>
                <tbody>
                    {/* Claim Type */}
                    <ClaimDetailRow
                        title={t('claims.claimType') + ':'}
                        value={
                            isEditing
                                ? claimDetail.claim_type_id
                                : claimTypeName
                        }
                        isEdit={isEditing}
                        options={lookups.claimTypes?.map(c => ({
                            label: c.claim_type_name,
                            value: c.claim_type_id,
                        }))}
                        onChange={(value) => handleSelectChange('claim_type_id', value)}
                    />

                    <ClaimDetailRow title={t('claims.dateSubmitted', 'Date Submitted') + ':'} value={submittedDate} />
                    <ClaimDetailRow title={t('claims.employee', 'Employee') + ':'} value={fullName} />
                    <ClaimDetailRow title={t('users.position') + ':'} value={position} />
                    <ClaimDetailRow title={t('users.department') + ':'} value={department} />

                    <ClaimDetailRow
                        title={t('users.team') + ':'}
                        value={isEditing ? claimDetail.team_id : teamName}
                        isEdit={isEditing}
                        options={lookups.teams?.filter(team => team.department_id === (curClaim?.department_id || curClaim?.user?.department_id)).map(
                            team => ({ label: team.team_name, value: team.team_id }))}
                        onChange={(value) => handleSelectChange('team_id', value)}
                    />
                </tbody>
            </table>

        </ComponentContainer>

        {/* Mileage details section - only show if claim has mileage */ }
        {!!curClaim?.claim_id && (
            <MileageByClaim claimId={curClaim.claim_id} toastRef={toastRef} />
        )}
        </>
    )
}

export default ClaimDetail