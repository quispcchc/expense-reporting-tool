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

    const targetPath = user === USER_TYPE.ADMIN
        ? `${claim.claim_id}/edit-claim`
        : `${claim.claim_id}/view-claim`

    const transactionCount = claim.expenses?.length || 0
    const employeeName = claim.user?.full_name || t('common.unknown', 'Unknown')

    return (
        <div className={`claim-card ${isSelected ? 'claim-card-selected' : ''}`}>
            <div className="flex items-start gap-3">
                <div className="pt-1">
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleSelection(claim)}
                    />
                </div>

                <Link to={targetPath} className="flex-1 no-underline text-inherit">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-xs text-gray-500 font-mono">#{claim.claim_id}</div>
                            <div className="text-sm font-semibold text-gray-900 mt-0.5">
                                {claim.claim_type?.claim_type_name}
                            </div>
                        </div>
                        <span className={`claim-card-status ${statusColor} whitespace-nowrap`}>
                            {statusName}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 mb-1">
                        <div className="claim-card-detail">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">{t('claims.employee', 'Employee')}</span>
                            <div className="text-sm font-medium text-gray-700 truncate">{employeeName}</div>
                        </div>
                        <div className="claim-card-detail">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">{t('claims.totalAmount', 'Total Amount')}</span>
                            <div className="text-sm font-bold text-gray-900">${Number(claim.total_amount || 0).toFixed(2)}</div>
                        </div>
                        <div className="claim-card-detail">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">{t('claims.submittedAt', 'Date')}</span>
                            <div className="text-sm text-gray-600">{formatDate(claim.claim_submitted)}</div>
                        </div>
                        <div className="claim-card-detail">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">{t('claims.transactions', 'Transactions')}</span>
                            <div className="flex items-center mt-0.5">
                                <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0 rounded border border-blue-100 font-medium">
                                    {transactionCount} {transactionCount === 1 ? t('claims.transaction', 'transaction') : t('claims.transactionsLabel', 'transactions')}
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="claim-card-actions self-center">
                    <Link to={targetPath}>
                        <Button
                            icon={user === USER_TYPE.ADMIN ? "pi pi-pencil" : "pi pi-eye"}
                            size="small"
                            text
                            className="p-button-rounded"
                        />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default MobileClaimCard
