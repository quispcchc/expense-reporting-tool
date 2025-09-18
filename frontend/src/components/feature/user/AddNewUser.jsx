import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { roles, teams, status } from '../../../utils/mockData.js'
import { Button } from 'primereact/button'
import { useUserDispatch } from '../../../contexts/UserContext.jsx'
import { generateId } from '../../../utils/helpers.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { MultiSelect } from 'primereact/multiselect'

function AddNewUser () {
    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const [selectedTeams, setSelectedTeams] = useState(null)
    const [selectedRoles, setSelectedRoles] = useState(null)
    const dispatch = useUserDispatch()
    const [userFormData, setUserFormData] = useState({
        first_name: '',
        last_name: '',
        position: '',
        status: '',
    })

    const handleUserFormChange = (e) => {
        const { name, value } = e.target
        setUserFormData(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    const handleUserFormSubmit = (e) => {
        e.preventDefault()

        const updatedUser = { ...userFormData, teams: selectedTeams, roles: selectedRoles, user_id: generateId() }

        const schema = validationSchemas.addUser
        const validation = validateForm(updatedUser, schema)

        console.log(validation)
        console.log(updatedUser)

        if (validation.isValid) {
            console.log(updatedUser)
            dispatch({ type: 'create', payload: updatedUser })
        }

        console.log(selectedTeams, selectedRoles)
        setErrors(validation.errors)

    }
    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">Add new user</h4>
                    <p className="text-xs text-gray-500">Lorem ipsum dolor sit amet, consectetur adipisicing elit. </p>
                </div>

                <button className={ `pi ${ isOpen ? 'pi-chevron-up' : 'pi-chevron-down' } !text-xl` }
                        onClick={ () => setIsOpen(prev => !prev) }></button>

            </div>
            { isOpen && (
                <form className="my-5" onSubmit={ handleUserFormSubmit }>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <Input name="first_name" id="first_name" label="First Name" value={ userFormData.first_name }
                               onChange={ handleUserFormChange } placeholder="Please enter first name"
                               errors={ errors }/>
                        <Input name="last_name" id="last_name" label="Last Name" value={ userFormData.last_name }
                               onChange={ handleUserFormChange } placeholder="Please enter last name"
                               errors={ errors }/>
                        <Select name="status" id="status" label="Status" options={ status }
                                value={ userFormData.status } onChange={ handleUserFormChange }
                                placeholder="Please selct status" errors={ errors }/>
                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">

                        {/* User may belong to multiple teams*/ }
                        <div>
                            <label htmlFor="team" className="block text-sm font-medium mb-2">Team</label>
                            <MultiSelect id="team" options={ teams } value={ selectedTeams }
                                         onChange={ (e) => setSelectedTeams(e.target.value) }
                                         placeholder="Please select team" className="w-full"/>
                            { errors.teams && <p className="text-red-500 text-sm mt-2">{ errors.teams }</p> }

                        </div>

                        <div>
                            <Input name="position" id="position" label="Position" value={ userFormData.position }
                                   onChange={ handleUserFormChange } placeholder="Please enter position"
                                   errors={ errors }/>
                        </div>

                        {/* User may have multiple roles*/ }
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium mb-2">Role</label>
                            <MultiSelect name="role" id="role" options={ roles } value={ selectedRoles }
                                         onChange={ (e) => setSelectedRoles(e.target.value) }
                                         placeholder="Please select role" className="w-full"/>
                            { errors.roles && <p className="text-red-500 text-sm mt-2">{ errors.roles }</p> }

                        </div>
                        <div className='col-span-3 flex justify-end'>
                            <Button label="Save" className="!h-[48px]"/>
                        </div>

                    </div>

                </form> ) }


        </div>
    )
}

export default AddNewUser