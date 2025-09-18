import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { roles, costCentres, status, teams, mockTeams } from '../../../utils/mockData.js'
import { Button } from 'primereact/button'
import { useCostCentreDispatch } from '../../../contexts/CostCentreContext.jsx'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'

function AddNewCostCentre () {
    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const dispatch = useCostCentreDispatch()
    const [costCentreFormData, setCostCentreFormData] = useState({
        area: '',
        code: '',
        status: '',
        description: '',
    })

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
            console.log(costCentreFormData)
            dispatch({ type: 'create', payload: costCentreFormData })
        }

        setErrors(validation.errors)

    }
    return (
        <div className="bg-white rounded-xl p-6">
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
                                options={ mockTeams.map(option => ( { label: option.name, value: option.name } )) }
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
                        <Select name="status" id="status" label="Status" options={ status }
                                value={ costCentreFormData.status } onChange={ handleCostCentreFormChange }
                                placeholder="Please selct status" errors={ errors }/>
                    </div>

                    <Button label="Add New" className="!h-[48px]"/>


                </form> ) }


        </div>
    )
}

export default AddNewCostCentre