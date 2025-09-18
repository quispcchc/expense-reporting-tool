import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { roles, teams, status } from '../../../utils/mockData.js'
import { Button } from 'primereact/button'
import { useTeamDispatch } from '../../../contexts/TeamContext.jsx'
import { generateId } from '../../../utils/helpers.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'

function AddNewTeam () {
    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const dispatch = useTeamDispatch()
    const [teamFormData, setTeamFormData] = useState({
        code: '',
        name: '',
        status: '',
    })

    const handleTeamFormChange = (e) => {
        const { name, value } = e.target
        setTeamFormData(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    const handleTeamFormSubmit = (e) => {
        e.preventDefault()
        const schema = validationSchemas.addTeam
        const validation = validateForm(teamFormData, schema)
        console.log(validation)

        if (validation.isValid) {
            console.log(teamFormData)
            dispatch({ type: 'create', payload: teamFormData })
        }

        setErrors(validation.errors)

    }
    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">Add new Team</h4>
                    <p className="text-xs text-gray-500">Lorem ipsum dolor sit amet, consectetur adipisicing elit. </p>
                </div>

                <button className={ `pi ${ isOpen ? 'pi-chevron-up' : 'pi-chevron-down' } !text-xl` }
                        onClick={ () => setIsOpen(prev => !prev) }></button>

            </div>
            { isOpen && (
                <form className={ `my-5 grid grid-cols-1 sm:grid-cols-7 ${errors.length ===0 ? "items-end" : "items-center"} gap-5` }
                      onSubmit={ handleTeamFormSubmit }>
                    <div className="col-span-2">
                        <Input name="code" id="code" label="Code" value={ teamFormData.code }
                               onChange={ handleTeamFormChange } placeholder="Please enter first name"
                               errors={ errors }/>
                    </div>
                    <div className="col-span-2">
                        <Input name="name" id="name" label=" Name" value={ teamFormData.last_name }
                               onChange={ handleTeamFormChange } placeholder="Please enter last name"
                               errors={ errors }/>
                    </div>
                    <div className="col-span-2">
                        <Select name="status" id="status" label="Status" options={ status }
                                value={ teamFormData.status } onChange={ handleTeamFormChange }
                                placeholder="Please selct status" errors={ errors }/>
                    </div>
                    <Button label="Add New" className="!h-[48px]"/>


                </form> ) }


        </div>
    )
}

export default AddNewTeam