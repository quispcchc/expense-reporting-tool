import React from 'react'
import StatusTab from '../../common/ui/StatusTab.jsx'
import { useTranslation } from 'react-i18next'

// Display the status of the claim
function ClaimStatus({ curClaim }) {
    const { t } = useTranslation()
    return (
        <div className='flex justify-between gap-4'>
            <p className="text-2xl">{t('common.status')}: </p>
            <StatusTab status={curClaim.claim_status_id} />
        </div>
    )
}

export default ClaimStatus