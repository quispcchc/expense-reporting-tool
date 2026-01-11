import React from 'react'
import { InputText } from 'primereact/inputtext'
function Input({ ...props }) {
    const { label, name, id, errors = [] } = { ...props }
    return (
        <div className='relative'>
            <div className="flex items-center gap-2 mb-2">
                <label htmlFor={id} className='block text-sm font-medium'>{label}</label>
                {errors[name] && <span className="text-status-danger text-xs">({errors[name]})</span>}
            </div>
            <InputText {...props} className='w-full' />
        </div>
    )
}

export default Input