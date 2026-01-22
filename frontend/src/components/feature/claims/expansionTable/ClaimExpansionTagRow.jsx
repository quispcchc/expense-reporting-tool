import React from 'react'
import TagMultiSelect from '../TagMultiSelect.jsx'

// Consistent multi-select row for tags, matching ClaimExpansionInputRow style
function ClaimExpansionTagRow({ label, field, value, isEditing, rowData, handleInputChange }) {
    return (
        <div className="flex items-center gap-4">
            <label className="text-sm font-semibold min-w-[150px]">
                {label}
            </label>
            <div className="flex-1">
                {isEditing ? (
                    <TagMultiSelect
                        value={value}
                        onChange={val => handleInputChange(rowData.transactionId, field, val)}
                    />
                ) : (
                    <p className='text-sm text-text-secondary'>
                        {Array.isArray(value) && value.length === 0 ? `No ${field} available.` : value}
                    </p>
                )}
            </div>
        </div>
    )
}

export default ClaimExpansionTagRow
