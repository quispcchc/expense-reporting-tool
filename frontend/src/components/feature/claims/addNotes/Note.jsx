import React from 'react'
import { formatDateTime } from '../../../../utils/formatters.js'

function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase()
}

function getRelativeTime(dateStr) {
    if (!dateStr) return ''
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDateTime(dateStr)
}

function Note({ submittedBy, date, description }) {
    return (
        <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4 last:mb-0">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] sm:text-xs font-semibold">
                {getInitials(submittedBy)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0 mb-0.5 sm:mb-1">
                    <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-none">{submittedBy}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400" title={formatDateTime(date)}>{getRelativeTime(date)}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap break-words">{description}</p>
            </div>
        </div>
    )
}

export default Note
