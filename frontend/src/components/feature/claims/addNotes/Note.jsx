import React from 'react'
import { formatDateTime } from '../../../../utils/formatters.js'

function Note({ submittedBy, date, description }) {
    return (
        <div className="bg-bg-secondary p-5 rounded-sm mb-3">
            <div className="flex justify-between">
                <p>{submittedBy}</p>
                <p>{formatDateTime(date)}</p>
            </div>
            <p>{description}</p>
        </div>
    )
}

export default Note
