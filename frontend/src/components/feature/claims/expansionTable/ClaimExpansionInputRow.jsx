import React from 'react'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'

// Customized expanded row: input editing in datatable
function ClaimExpansionInputRow({ label, field, value, isEditing, rowData, handleInputChange, type = 'text' }) {
    return (
        <div className="flex items-start gap-4">
            <label className="text-sm font-semibold min-w-[150px] pt-2">
                {label}
            </label>
            <div className="flex-1">
                {isEditing ? (
                    type === 'textarea' ? (
                        <InputTextarea
                            value={value}
                            onChange={(e) => handleInputChange(rowData.transactionId, field, e.target.value)}
                            className="w-full md:w-80"
                            rows={3}
                            autoResize
                        />
                    ) : (
                        <InputText
                            value={value}
                            onChange={(e) => handleInputChange(rowData.transactionId, field, e.target.value)}
                            className="w-full md:w-80"
                        />
                    )
                ) : (
                    // If not editing, display the value or a placeholder text if empty
                    <p className='text-sm text-text-secondary pt-2 whitespace-pre-wrap'>
                        {value || `No ${field} available.`}
                    </p>
                )}
            </div>
        </div>)
}

export default ClaimExpansionInputRow