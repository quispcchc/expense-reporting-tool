import React, { useEffect, useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { roles, teams, status } from '../../../utils/mockData.js'
import { Button } from 'primereact/button'
import { useUserDispatch } from '../../../contexts/UserContext.jsx'
import { generateId } from '../../../utils/helpers.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { MultiSelect } from 'primereact/multiselect'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { Dropdown } from 'primereact/dropdown'

function AddNewUser () {
    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const { lookups } = useLookups()

    // const [selectedTeams, setSelectedTeams] = useState(null)
    // const [selectedRoles, setSelectedRoles] = useState(null)
    const { createUser } = useUserDispatch()

    const [userFormData, setUserFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        department: '',
        team: '',
        position: '',
        role: '',

    })

    useEffect(() => {
        console.log(userFormData)
    }, [userFormData])

    const handleUserFormChange = (e) => {
        const { name, value } = e.target
        setUserFormData(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    const handleUserFormSubmit = (e) => {
        e.preventDefault()

        // const updatedUser = { ...userFormData, teams: selectedTeams, roles: selectedRoles, user_id: generateId() }

        const schema = validationSchemas.addUser
        // const validation = validateForm(updatedUser, schema)
        const validation = validateForm(userFormData, schema)

        console.log(validation)

        // console.log(updatedUser)

        if (validation.isValid) {
            ;( async() => {
                try {
                    await createUser({
                        first_name: userFormData.first_name,
                        last_name: userFormData.last_name,
                        email: userFormData.email || '',
                        role_id: userFormData.role,
                        team_id: userFormData.team
                    })
                    // Optionally clear form on success
                    setUserFormData({ })
                    // setSelectedRoles(null)
                    // setSelectedTeams(null)
                }
                catch (err) {
                    console.error('Failed to create user', err)
                    setErrors(prev => ( { ...prev, form: err.message } ))
                }
            } )()
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
                               onChange={ handleUserFormChange } placeholder="First Name"
                               errors={ errors }/>
                        <Input name="last_name" id="last_name" label="Last Name" value={ userFormData.last_name }
                               onChange={ handleUserFormChange } placeholder="Last Name"
                               errors={ errors }/>

                        <Input name="email" id="email" label="Email" value={ userFormData.email }
                               onChange={ handleUserFormChange } placeholder="Email"
                               errors={ errors }/>

                    </div>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <Select id="department" name="department" label='department' value={ userFormData.department }
                                      onChange={ handleUserFormChange }
                                      placeholder="Deaprtment" className="w-full"
                                      options={ lookups.departments.map(option => ( {
                                          value: option.department_id,
                                          label: option.department_name,
                                      } )) }
                                      errors={errors}
                            />
                        </div>

                        {/* User may belong to multiple teams*/ }
                        <div>
                            <Select id="team" name="team" label='team' value={ userFormData.team }
                                    onChange={ handleUserFormChange }
                                    placeholder="team" className="w-full"
                                    options={ lookups.teams.map(option => ( {
                                        value: option.team_id,
                                        label: option.team_name,
                                    } )) }
                                    errors={errors}
                            />

                            {/*<label htmlFor="team" className="block text-sm font-medium mb-2">Team</label>*/}
                            {/*<MultiSelect id="team" options={ teams } value={ selectedTeams }*/}
                            {/*             onChange={ (e) => setSelectedTeams(e.target.value) }*/}
                            {/*             placeholder="Please select team" className="w-full"/>*/}
                            {/*{ errors.team && <p className="text-red-500 text-sm mt-2">{ errors.team }</p> }*/}

                        </div>

                        <div>
                            <Input name="position" id="position" label="Position" value={ userFormData.position }
                                   onChange={ handleUserFormChange } placeholder="Please enter position"
                                   errors={ errors }/>
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium mb-2">Role</label>
                            <Select name="role" id="role" value={ userFormData.role } className="w-full"
                                    options={ lookups.roles.map(option => ( { label: option.role_name, value: option.role_id } )) }
                                    onChange={ handleUserFormChange }
                                    placeholder="Role" errors={ errors }/>
                            {/*{ .roles && <p className="text-red-500 text-sm mt-2">{ errors.roles }</p> }*/ }

                        </div>
                        {/*<div className="">*/ }
                        <Button label="Save" className="!h-[48px]"/>
                        {/*</div>*/ }

                    </div>

                </form> ) }


        </div>
    )
}

export default AddNewUser