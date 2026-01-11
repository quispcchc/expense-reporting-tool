import React from 'react'
import { Dropdown } from 'primereact/dropdown'

function Select(props) {
    const { name, id, value, label, onChange, options, placeholder = 'Select an option', errors = [] } = { ...props }
    return (
        <div className='relative'>
            <div className="flex items-center gap-2 mb-2">
                <label htmlFor={id} className="block text-sm font-medium">
                    {label}
                </label>
                {errors[name] && <span className="text-red-500 text-xs">({errors[name]})</span>}
            </div>
            <Dropdown {...props} className='w-full' optionLabel="label" />
        </div>
    )
}

export default Select