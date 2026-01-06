import React from 'react'
import { Dropdown } from 'primereact/dropdown'

// Single row in the ClaimDetail table showing a title and its corresponding value
function ClaimDetailRow ({ title, value, isEdit, options, onChange }) {

    return (
        <tr>
            <th className="text-left py-2 font-medium">{ title }</th>

            <td className="py-2">
                {isEdit ? (
                    <Dropdown
                        options={options}
                        value={value}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => onChange?.(e.value)}
                        placeholder="Select…"
                        className="w-full"
                    />
                ) : (
                    value
                )}
            </td>
        </tr>
    )
}

export default ClaimDetailRow