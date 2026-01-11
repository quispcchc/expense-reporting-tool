import React from 'react'
import { STATUS_STYLES } from '../../../utils/customizeStyle.js'

function ActiveStatusTab({ status }) {
    let label = '';
    let color = '';

    switch (status) {
        case 1:
            label = 'Active';
            color = 'bg-status-success text-status-success';
            break;
        case 2:
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

export default ActiveStatusTab
