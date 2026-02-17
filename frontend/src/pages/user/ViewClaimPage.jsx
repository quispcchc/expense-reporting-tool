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

function ViewClaimPage() {
    const { t } = useTranslation()
    const { claimId } = useParams()
    const { getClaimById } = useClaims()
    const [curClaim, setCurClaim] = useState()

    const { authUser } = useAuth()
    const path = authUser.role_name === 'regular_user' ? '/user' : '/admin'

    const fetchClaim = async () => {
        try {
            const data = await getClaimById(Number(claimId))
            setCurClaim(data)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchClaim()
    }, [claimId, getClaimById])

    if (!curClaim) return <Loader />

    // Total amount is the sum of expense amounts (mileage is included in expense amounts)
    const totalAmount = (curClaim.expenses || []).reduce(
        (sum, exp) => sum + (parseFloat(exp.expense_amount) || 0), 0
    )

    return (
        <div>
            <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                <ContentHeader title={`${t('claims.claimNumber', 'Claim')} #${claimId}`} homePath={path} />
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-end">
                        <p className="text-lg font-medium">{t('claims.totalAmount')}</p>
                        <p className="text-blue-500 text-xl">${totalAmount.toFixed(2)}</p>
                    </div>
                    <ClaimStatus curClaim={curClaim} />
                </div>
            </div>

            <div className="flex flex-wrap gap-5 my-5">
                <div className="flex-1 min-w-[280px]"><ClaimDetail curClaim={curClaim} onClaimRefetch={fetchClaim} /></div>
                <div className="flex-1 min-w-[280px]">
                    {/* when in view claim mode, disable add note function*/}
                    <ClaimNotes notes={curClaim.notes} curClaim={curClaim} mode='view' />
                </div>
            </div>

            <EditableExpansionTable data={curClaim.expenses} curClaim={curClaim} mode='view'
                mileage={curClaim.mileage}
            />

        </div>
    )
}

export default ViewClaimPage