import React, { useEffect, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useParams } from 'react-router-dom'
import ClaimDetail from '../../components/feature/claims/ClaimDetail.jsx'
import { useClaims } from '../../contexts/ClaimContext.jsx'
import ClaimNotes from '../../components/feature/claims/addNotes/ClaimNotes.jsx'
import ClaimStatus from '../../components/feature/claims/ClaimStatus.jsx'
import EditableExpansionTable from '../../components/feature/claims/expansionTable/EditableExpansionTable.jsx'
import Loader from '../../components/common/ui/Loader.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useTranslation } from 'react-i18next'
import { ROLE_NAME, VIEW_MODE } from '../../config/constants.js'

function ViewClaimPage() {
    const { t } = useTranslation()
    const { claimId } = useParams()
    const { getClaimById } = useClaims()
    const [curClaim, setCurClaim] = useState()

    const { authUser } = useAuth()
    const path = authUser.role_name === ROLE_NAME.USER ? '/user' : '/admin'

    const fetchClaim = async () => {
        try {
            const data = await getClaimById(Number(claimId))
            setCurClaim(data)
        } catch (error) {
            // Error handled by caller
        }
    }

    useEffect(() => {
        fetchClaim()
    }, [claimId, getClaimById])

    if (!curClaim) return <Loader />

    return (
        <div>
            <div className="flex justify-between items-center flex-wrap">
                <ContentHeader title={`${t('claims.claimNumber', 'Claim')} #${claimId}`} homePath={path} />
                <ClaimStatus curClaim={curClaim} />
            </div>

            <div className="flex flex-wrap gap-5 my-5">
                <div className="flex-1 min-w-[280px]"><ClaimDetail curClaim={curClaim} onClaimRefetch={fetchClaim} /></div>
                <div className="flex-1 min-w-[280px]">
                    {/* when in view claim mode, disable add note function*/}
                    <ClaimNotes notes={curClaim.notes} curClaim={curClaim} mode={VIEW_MODE.VIEW} />
                </div>
            </div>

            <EditableExpansionTable data={curClaim.expenses} curClaim={curClaim} mode={VIEW_MODE.VIEW} />

        </div>
    )
}

export default ViewClaimPage