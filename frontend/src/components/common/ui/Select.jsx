import React from 'react'
import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'

function Select(props) {
    const { t } = useTranslation()
    const { name, id, value, label, onChange, options, placeholder = t('filters.selectIndication'), errors = [] } = { ...props }
    return (
        <div className='relative'>
            <div className="flex items-center gap-2 mb-2">
                <label htmlFor={id} className="block text-sm font-medium">
                    {label}
                </label>
                {errors[name] && <span className="text-status-danger text-xs">({t(errors[name])})</span>}
            </div>
            <Dropdown {...props} className='w-full' optionLabel="label" />
        </div>
    )
}

export default Select