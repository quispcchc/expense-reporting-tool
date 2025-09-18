import React from 'react'
import { STATUS_STYLES } from '../../../utils/customizeStyle.js'

function StatusTab({ status }) {
    const style = STATUS_STYLES[status] || 'bg-[#FFF5C5] text-[#E27D00]'

    return (
        <div className={`rounded-lg p-1 text-center text-sm font-medium w-21 ${style}`}>
            {status}
        </div>
    )
}

export default StatusTab
