import React from 'react'
import { STATUS_STYLES } from '../../../utils/customizeStyle.js'

function StatusTab({ status }) {
    let label = '';
    let color = '';

    switch (status) {
        // Numeric cases for claim status
        case 1:
            label = 'Pending';
            color = 'bg-status-pending text-status-pending';
            break;
        case 2:
            label = 'Approved';
            color = 'bg-status-success text-status-success';
            break;
        case 3:
            label = 'Rejected';
            color = 'bg-status-danger text-status-danger';
            break;
        // String cases for active status
        case 'Active':
            label = 'Active';
            color = 'bg-status-success text-status-success';
            break;
        case 'Inactive':
            label = 'Inactive';
            color = 'bg-status-danger text-status-danger';
            break;
        default:
            label = 'Unknown';
            color = 'bg-status-pending text-status-pending';
    }



    return (
        <div className={`rounded-lg p-1 text-center text-sm font-medium w-21 ${color}`}>
            {label}
        </div>
    )
}

export default StatusTab
