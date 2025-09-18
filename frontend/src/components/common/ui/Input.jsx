import React from 'react'
import { InputText } from 'primereact/inputtext'
function Input ({...props}) {
    const {label,name,id,errors=[]} = {...props}
    return (
        <div>
            <label htmlFor={id} className='block text-sm font-medium mb-2'>{label}</label>
            <InputText {...props} className='w-full'/>
            { errors[name] && <p className="text-red-500 text-sm mt-2">{ errors[name] }</p> }
        </div>
    )
}

export default Input