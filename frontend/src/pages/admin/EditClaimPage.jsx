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
import { VIEW_MODE } from '../../config/constants.js'


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
        catch {
            // Error handled by caller
        }
    }

    useEffect(() => {
        fetchClaim()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [claimId])

    const toast = useRef(null)

    if (!curClaim) return <Loader />

    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="flex justify-between items-center flex-wrap">
                <ContentHeader title={`${t('claims.claimNumber', 'Claim')} #${claimId}`} homePath="/admin" />
                <ClaimStatus curClaim={curClaim} />
            </div>

            <div className="flex flex-col lg:flex-row gap-5 my-5 items-stretch">
                <div className="flex-1 flex min-w-0"><ClaimDetail curClaim={curClaim} toastRef={toast} onClaimRefetch={fetchClaim} /></div>
                <div className="flex-1 flex min-w-0">
                    <ClaimNotes curClaim={curClaim} toastRef={toast} />
                </div>
            </div>

            <EditableExpansionTable data={curClaim.expenses} curClaim={curClaim} mode={VIEW_MODE.EDIT} toastRef={toast}
                onClaimUpdated={fetchClaim}
            />

        </div>
    )
}

export default EditClaimPage