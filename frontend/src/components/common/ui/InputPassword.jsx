import React, { useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
function InputPassword ({...props}) {
    const [showPassword, setShowPassword] = useState(false)
    const {label,name,id,errors=[]} = {...props}
    return (
        <div className='mb-3'>
            <label htmlFor={id} className='block text-sm font-medium mb-2'>{label}</label>
            <IconField>
                <InputIcon className={ `pi ${ showPassword ? 'pi-eye-slash' : 'pi-eye' }` }
                           onClick={ ()=> setShowPassword(prev => !prev) }> </InputIcon>
                <InputText type={ `${ showPassword ? 'text' : 'password' }` }
                           className="w-full"
                           {...props}
                />
            </IconField>
            { errors[name] && <p className="text-red-500 text-sm mt-2">{ errors[name] }</p> }
        </div>
    )
}

export default InputPassword