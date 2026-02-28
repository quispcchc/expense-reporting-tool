import React from 'react'
import { useTranslation } from 'react-i18next'
import { APPROVAL_STATUS, ACTIVE_STATUS } from '../../../config/constants.js'

function StatusTab({ status }) {
    const { t } = useTranslation()
    let label = '';
    let color = '';

    switch (status) {
        // Numeric cases for claim/expense approval status
        case APPROVAL_STATUS.PENDING:
            label = t('status.pending', 'Pending');
            color = 'bg-status-pending text-status-pending';
            break;
        case APPROVAL_STATUS.APPROVED:
            label = t('status.approved', 'Approved');
            color = 'bg-status-success text-status-success';
            break;
        case APPROVAL_STATUS.REJECTED:
            label = t('status.rejected', 'Rejected');
            color = 'bg-status-danger text-status-danger';
            break;
        // String cases for active status (passed as name from lookups)
        case 'Active':
            label = t('status.active', 'Active');
            color = 'bg-status-success text-status-success';
            break;
        case 'Inactive':
            label = t('status.inactive', 'Inactive');
            color = 'bg-status-danger text-status-danger';
            break;
        default:
            label = t('status.unknown', 'Unknown');
            color = 'bg-status-pending text-status-pending';
    }

    return (
        <div className={`rounded-lg p-1 text-center text-sm font-medium w-21 ${color}`}>
            {label}
        </div>
    )
}

export default StatusTab
