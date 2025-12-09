import React from 'react'
import { STATUS_STYLES } from '../../../utils/customizeStyle.js'

function StatusTab({ status }) {
    let label = '';
    let color = '';

    switch(status) {
        case 1:
            label = 'Pending';
            color = 'bg-[#FFF5C5] text-[#E27D00]';
            break;
        case 2:
            label = 'Approved';
            color = 'bg-[#B2FFB4] text-[#04910C]';
            break;
        case 3:
            label = 'Rejected';
            color = 'bg-[#FFDCDC] text-[#FF0000]';
            break;
        default:
            label = 'Unknown';
            color = 'bg-[#FFF5C5] text-[#E27D00]';
    }



    return (
        <div className={`rounded-lg p-1 text-center text-sm font-medium w-21 ${color}`}>
            {label}
        </div>
    )
}

export default StatusTab
