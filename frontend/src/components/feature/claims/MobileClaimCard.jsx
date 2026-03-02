import { Link } from 'react-router-dom'
import { Checkbox } from 'primereact/checkbox'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'
import { formatDate } from '../../../utils/formatters.js'
import { USER_TYPE } from '../../../config/constants.js'

const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Draft': 'bg-gray-100 text-gray-800',
}

function MobileClaimCard({ claim, isSelected, onToggleSelection, user }) {
    const { t } = useTranslation()
    const statusName = claim.status?.claim_status_name || 'Unknown'
    const statusColor = STATUS_COLORS[statusName] || 'bg-gray-100 text-gray-800'

    return (
        <div className={`claim-card ${isSelected ? 'claim-card-selected' : ''}`}>
            <div className="claim-card-header">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleSelection(claim)}
                    />
                    <div>
                        <div className="text-xs text-gray-500">{t('claims.requestNumber', 'ID')}: {claim.claim_id}</div>
                        <div className="text-sm font-medium">
                            {claim.claim_type?.claim_type_name} · ${claim.total_amount}
                        </div>
                    </div>
                </div>
                <span className={`claim-card-status ${statusColor}`}>
                    {statusName}
                </span>
            </div>
            <div className="claim-card-body">
                <div className="claim-card-detail">
                    <span className="text-gray-500 text-xs">{t('claims.submittedAt', 'Date')}</span>
                    <div className="text-sm">{formatDate(claim.claim_submitted)}</div>
                </div>
                <div className="claim-card-actions">
                    {user === USER_TYPE.ADMIN ? (
                        <Link to={`${claim.claim_id}/edit-claim`}>
                            <Button icon="pi pi-pencil" size="small" text />
                        </Link>
                    ) : (
                        <Link to={`${claim.claim_id}/view-claim`}>
                            <Button icon="pi pi-eye" size="small" text />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default MobileClaimCard
