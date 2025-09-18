import React from 'react'
import { Dropdown } from 'primereact/dropdown'

function Select (props) {
    const { name, id, value,label, onChange, options,placeholder='Select an option',errors=[] } = { ...props }
    return (
        <div>
            <label htmlFor={ id } className="block text-sm font-medium mb-2">
                {label }
            </label>
            <Dropdown {...props} className='w-full'/>
            { errors[name] && <p className="text-red-500 text-sm mt-2">{ errors[name] }</p> }
        </div>
    )
}

export default Select