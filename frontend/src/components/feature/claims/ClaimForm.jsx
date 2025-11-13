import React from 'react'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { useLookups } from '../../../contexts/LookupContext.jsx'

function ClaimForm ({ claimFormData, onFieldChange, errors }) {
    const {lookups:{departments,claimTypes}} = useLookups()

    return (
        // Main container with title and description
        <ComponentContainer title="Expense Claim Form">
            <p className="text-gray-300 text-xs mb-3">Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                Accusantium.</p>

            {/* Two autofilled input fields side by side: Employee Name (disabled) and Position */ }
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Name input - disabled to prevent editing */ }
                <Input label="Employee Name" name="employeeName" id="employeeName" disabled
                       value={ claimFormData.employeeName } onChange={ onFieldChange } errors={ errors }/>

                {/* Position input - editable */ }
                <Input label="Position" name="position" id="position" value={ claimFormData.position }
                       onChange={ onFieldChange } errors={ errors }/>
            </div>

            {/* Dropdown select for Claim Type */ }
            <Select name="claimType" id="claimType" label="Claim type" value={ claimFormData.claimType || '' }
                    options={ claimTypes.map(opt=>({label:opt.claim_type_name,value:opt.claim_type_name})) }
                    onChange={ onFieldChange } placeholder="Select a Claim Type"
                    errors={ errors }/>

            {/* Dropdown select for Team */ }
            <Select name="team" id="team" label="Team" value={ claimFormData.team }
                    onChange={ onFieldChange }
                    options={ departments.map(opt=>({label:opt.department_name,value:opt.department_name})) }
                    placeholder="Select a department"
                    errors={ errors }/>

            {/* Textarea input for additional notes */ }
            <div className="mb-4">
                <p className="mt-5">Notes</p>
                <div className="relative">
                    <textarea
                        name="note"
                        rows="3"
                        onChange={ onFieldChange }
                        value={ claimFormData.note }
                        placeholder="Enter a text..."
                        className="w-full border border-gray-300 rounded-md p-3"
                    />
                </div>
            </div>

        </ComponentContainer>
    )
}

export default ClaimForm