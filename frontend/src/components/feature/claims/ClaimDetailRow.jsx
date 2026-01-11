import React from 'react'
import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'

// Single row in the ClaimDetail table showing a title and its corresponding value
function ClaimDetailRow({ title, value, isEdit, options, onChange }) {
    const { t } = useTranslation()

    return (
        <tr>
            <th className="text-left py-2 font-medium">{title}</th>

            <td className="py-2">
                {isEdit ? (
                    <Dropdown
                        options={options}
                        value={value}
                        optionLabel="label"
                        optionValue="value"
                        onChange={(e) => onChange?.(e.value)}
                        placeholder={t('filter.select')}
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