import React, { useEffect, useRef, useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { useParams } from 'react-router-dom'
import ClaimDetail from '../../components/feature/claims/ClaimDetail.jsx'
import { useClaims } from '../../contexts/ClaimContext.jsx'
import ClaimNotes from '../../components/feature/claims/addNotes/ClaimNotes.jsx'
import ClaimStatus from '../../components/feature/claims/ClaimStatus.jsx'
import EditableExpansionTable from '../../components/feature/claims/expansionTable/EditableExpansionTable.jsx'
import Loader from '../../components/common/ui/Loader.jsx'
import { Toast } from 'primereact/toast'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { useTranslation } from 'react-i18next'


function EditClaimPage() {
    const { t } = useTranslation()
    const { claimId } = useParams()
    const { getClaimById } = useClaims()

    const [curClaim, setCurClaim] = useState(null)

    const fetchClaim = async () => {
        try {
            const data = await getClaimById(Number(claimId))
            setCurClaim(data)
        }
        catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchClaim()
    }, [claimId])

    const toast = useRef(null)

    if (!curClaim) return <Loader />

    // Total amount is the sum of expense amounts (mileage is included in expense amounts)
    const totalAmount = (curClaim.expenses || []).reduce(
        (sum, exp) => sum + (parseFloat(exp.expense_amount) || 0), 0
    )

    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                <ContentHeader title={`${t('claims.claimNumber', 'Claim')} #${claimId}`} homePath="/admin" />
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-end">
                        <p className="text-lg font-medium">{t('claims.totalAmount')}</p>
                        <p className="text-blue-500 text-xl">${totalAmount.toFixed(2)}</p>
                    </div>
                    <ClaimStatus curClaim={curClaim} />
                </div>
            </div>

            <div className="flex flex-wrap gap-5 my-5 items-stretch">
                <div className="flex-1 flex min-w-[280px]"><ClaimDetail curClaim={curClaim} toastRef={toast} onClaimRefetch={fetchClaim} /></div>
                <div className="flex-1 flex min-w-[280px]">
                    <ClaimNotes curClaim={curClaim} toastRef={toast} />
                </div>
            </div>

            <EditableExpansionTable data={curClaim.expenses} curClaim={curClaim} mode="edit" toastRef={toast}
                onClaimUpdated={fetchClaim}
                mileage={curClaim.mileage}
            />

        </div>
    )
}

export default EditClaimPage