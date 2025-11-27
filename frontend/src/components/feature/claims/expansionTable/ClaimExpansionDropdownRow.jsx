import React from 'react'
import { Dropdown } from 'primereact/dropdown'

// Customized expanded row: dropdown editing in datatable
function ClaimExpansionDropdownRow ({ label, field, value, options, placeholder,isEditing, rowData, handleInputChange }) {
    return (
        <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 min-w-[150px]">
                { label }
            </label>
            <div className="flex-1">
                { isEditing ? (
                    // If editing, show a dropdown with options and change handler
                    <Dropdown
                        value={ value }
                        options={ options }
                        optionLabel="label"
                        onChange={ (e) => handleInputChange(rowData.transactionId, field, e.target.value) }
                        className="w-80"
                        placeholder={placeholder}
                        showClear
                        disabled={ !isEditing }
                    />
                ) : (
                    // If not editing, just display the value as text
                    <p className="text-sm text-[#888888]">
                        { options.find(opt => opt.value === value)?.label || 'dd' }
                    </p>
                )
                }
            </div>
        </div> )
}

export default ClaimExpansionDropdownRow