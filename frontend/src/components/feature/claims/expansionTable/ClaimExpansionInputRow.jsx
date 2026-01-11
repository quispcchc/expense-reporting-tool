import React from 'react'
import { InputText } from 'primereact/inputtext'

// Customized expanded row: input editing in datatable
function ClaimExpansionInputRow({ label, field, value, isEditing, rowData, handleInputChange }) {
    return (
        <div className="flex items-center gap-4">
            <label className="text-sm font-semibold min-w-[150px]">
                {label}
            </label>
            <div className="flex-1">
                {isEditing ? (
                    // If editing, show an input text box with current value and change handler
                    <InputText
                        value={value}
                        onChange={(e) => handleInputChange(rowData.transactionId, field, e.target.value)}
                        className="w-80"
                    />
                ) : (
                    // If not editing, display the value or a placeholder text if empty
                    <p className='text-sm text-text-secondary'>
                        {value || `No ${field} available.`}
                    </p>
                )}
            </div>
        </div>)
}

export default ClaimExpansionInputRow