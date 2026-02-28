import React from 'react'
import { useTranslation } from 'react-i18next'
import { ACTIVE_STATUS } from '../../../config/constants.js'

function ActiveStatusTab({ status }) {
    const { t } = useTranslation()
    let label = '';
    let color = '';

    switch (status) {
        case ACTIVE_STATUS.ACTIVE:
            label = t('status.active', 'Active');
            color = 'bg-status-success text-status-success';
            break;
        case ACTIVE_STATUS.INACTIVE:
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

export default ActiveStatusTab
