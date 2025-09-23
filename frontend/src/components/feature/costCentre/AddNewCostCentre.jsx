import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { Button } from 'primereact/button'
import { useCostCentre } from '../../../contexts/CostCentreContext.jsx'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { ProgressSpinner } from 'primereact/progressspinner'

function AddNewCostCentre () {
    const { lookups } = useLookups()
    const { actions } = useCostCentre()
    const { state } = useCostCentre()
    const { loading } = state

    const { createCostCentre } = actions

    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const initialData = {
        area: '',
        code: '',
        status: '',
        description: '',
    }
    const [costCentreFormData, setCostCentreFormData] = useState(initialData)

    const handleCostCentreFormChange = (e) => {
        const { name, value } = e.target
        setCostCentreFormData(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    const handleCostCentreFormSubmit = (e) => {
        e.preventDefault()
        const schema = validationSchemas.addCostCentre
        const validation = validateForm(costCentreFormData, schema)
        console.log(validation)

        if (validation.isValid) {
            createCostCentre(costCentreFormData)
            setCostCentreFormData(initialData)
        }
        setErrors(validation.errors)

    }
    return (

        <div className="bg-white rounded-xl p-6">
            { loading && (
                <div className="absolute inset-0 flex justify-center items-center bg-white/50 z-10">
                    <ProgressSpinner/>
                </div>
            ) }

            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">Add new CostCentre</h4>
                    <p className="text-xs text-gray-500">Lorem ipsum dolor sit amet, consectetur adipisicing elit. </p>
                </div>

                <button className={ `pi ${ isOpen ? 'pi-chevron-up' : 'pi-chevron-down' } !text-xl` }
                        onClick={ () => setIsOpen(prev => !prev) }></button>
            </div>

            { isOpen && (
                <form className={ `my-5 grid grid-cols-1 sm:grid-cols-5 ${ errors.length === 0
                    ? 'items-end'
                    : 'items-center' } gap-5` }
                      onSubmit={ handleCostCentreFormSubmit }>
                    <div className="col-span-3">
                        <Select name="area" id="area" label="Team"
                                options={ lookups.teams.map(
                                    option => ( { label: option.team_name, value: option.team_id } )) }
                                value={ costCentreFormData.area } onChange={ handleCostCentreFormChange }
                                placeholder="Please selct team" errors={ errors }/>
                    </div>

                    <div className="col-span-2">
                        <Input name="code" id="code" label="Code" value={ costCentreFormData.code }
                               onChange={ handleCostCentreFormChange } placeholder="Please enter code"
                               errors={ errors }/>
                    </div>

                    <div className="col-span-2">
                        <Input name="description" id="description" label="Description"
                               value={ costCentreFormData.description }
                               onChange={ handleCostCentreFormChange } placeholder="Please enter description"
                               errors={ errors }/>
                    </div>

                    <div className="col-span-2">
                        <Select name="status" id="status" label="Status" options={ lookups.activeStatuses.map(
                            option => ( { label: option.active_status_name, value: option.active_status_id } )) }
                                value={ costCentreFormData.status } onChange={ handleCostCentreFormChange }
                                placeholder="Please selct status" errors={ errors }/>
                    </div>

                    <Button label="Add New" className="!h-[48px]"/>

                </form> ) }


        </div>

    )
}

    export default AddNewCostCentre