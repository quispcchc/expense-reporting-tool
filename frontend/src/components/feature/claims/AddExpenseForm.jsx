import React from 'react'
import UploadAttachment from './uploadAttchment/UploadAttachment.jsx'
import TagInput from './TagInput.jsx'
import { Button } from 'primereact/button'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import EditableExpansionTable from './expansionTable/EditableExpansionTable.jsx'
import { autoFillForm } from '../../../utils/helpers.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'

function AddExpenseForm ({
    claimFormData,
    expenseFormData,
    onSetExpenseForm,
    onClaimItemsUpdate,
    onExpenseChange,
    onAddExpense,
    tags,
    onSetTags,
    files,
    onSetFiles,
    errors,
}) {
    const { lookups: { costCentres, projects,accountNums } } = useLookups()

    return (
        <div className="bg-white h-full rounded-2xl shadow-sm">
            <div className="flex justify-between items-center my-6 bg-blue-100 rounded-t-2xl p-6">
                <div>
                    <p className="text-[22px]">Add Expenses</p>
                    <p className="text-gray-500 text-sm">Lorem ipsum dolor sit amet, consectetur adipisicing elit. </p>
                </div>
                <div>
                    <p className="text-2xl">Total Amount</p>
                </div>

            </div>

            {/* Main form content split into two columns */ }
            <div className="flex justify-between my-5 gap-10 flex-wrap px-6">

                {/* Left column with input fields */ }
                <div className="flex-1">
                    <div className="flex flex-col gap-3">

                        {/* Program select dropdown */ }
                        <Select name="program" id="program" label="Program" value={ expenseFormData.program }
                                onChange={ onExpenseChange }
                                options={ projects.map(opt => ( {
                                    label: `${ opt.project_name }`,
                                    value: opt.project_name,
                                } )) }
                                placeholder="Select a program"
                                errors={ errors }/>

                        {/* Transaction date input */ }
                        <Input name="transactionDate" id="transactionDate" label="Transaction Date (yyyy/mm/dd)*"
                               value={ expenseFormData.transactionDate } type="date"
                               onChange={ onExpenseChange }
                               placeholder="Select a transaction date"
                               errors={ errors }/>

                        {/* Cost Centre select dropdown, mapped to label and value */ }
                        <Select name="costCentre" id="costCentre" label="Cost Centre"
                                value={ expenseFormData.costCentre }
                                onChange={ onExpenseChange }
                                options={ costCentres.map((opt) => ( {
                                    label: `${ opt.cost_centre_code } - ${ opt.description }`,
                                    value: `${ opt.cost_centre_code } - ${ opt.description }`,
                                } )) }
                                placeholder="Select a cost centre"
                                errors={ errors }/>

                        {/* Vendor / Service Provider input */ }
                        <Input name="vendor" id="vendor" label="Vendor / Service Provider"
                               value={ expenseFormData.vendor }
                               onChange={ onExpenseChange }
                               placeholder="Please enter vender"
                               errors={ errors }/>

                        {/* Account Number select dropdown, mapped to label and value */ }
                        <Select name="accountNum" id="accountNum" label="Account Number"
                                value={ expenseFormData.accountNum }
                                onChange={ onExpenseChange }
                                options={ accountNums.map((opt) => ( {
                                    label: `${ opt.account_number } - ${ opt.description }`,
                                    value: `${ opt.account_number } - ${ opt.description }`,
                                } )) }
                                placeholder="Select a Account Number"
                                errors={ errors }/>

                        {/* Amount and Buyer inputs side by side */ }
                        <div className="flex justify-between flex-wrap gap-3">
                            <div className="flex-1">
                                <Input name="amount" id="amount" label="Amount"
                                       value={ expenseFormData.amount }
                                       onChange={ onExpenseChange }
                                       placeholder="Please enter amount"
                                       errors={ errors }/>
                            </div>
                            <div className="flex-1">
                                <Input name="buyer" id="buyer" label="Buyer"
                                       value={ expenseFormData.buyer }
                                       onChange={ onExpenseChange }
                                       placeholder="Please enter buyer"
                                       errors={ errors }/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column with description, notes, attachments, and tags */ }
                <div className="flex-1">

                    {/* Expense Description textarea */ }
                    <div className="mb-4">
                        <h4 className="text-[22px]">Expense Description</h4>
                        <textarea
                            placeholder="Enter your message here..."
                            name="description"
                            value={ expenseFormData.description }
                            rows="3"
                            className="w-full border border-gray-300 rounded-md p-3 text-sm"
                            onChange={ onExpenseChange }
                        />
                    </div>

                    {/* Notes textarea */ }
                    <div className="mb-4">
                        <h4 className="text-[22px]">Notes</h4>
                        <div className="relative">
                    <textarea
                        name="notes"
                        rows="3"
                        onChange={ onExpenseChange }
                        value={ expenseFormData.notes }
                        placeholder="Enter a text..."
                        className="w-full border border-gray-300 rounded-md p-3"
                    />
                        </div>
                    </div>

                    {/* File upload component */ }
                    <UploadAttachment files={ files } onSetFiles={ onSetFiles }/>

                    {/* Tag input component */ }
                    <TagInput tags={ tags } onSetTags={ onSetTags }/>

                </div>
            </div>

            {/* Buttons for adding expense and autofill form (autofill:for quick test) */ }
            <div className="flex justify-end gap-2 p-5">
                <Button label="Add Expense" type="button" icon="pi pi-check" iconPos="right"
                        onClick={ onAddExpense }/>
                <Button label="Auto Fill Form" type="button" onClick={ () => autoFillForm(onSetExpenseForm) }/>
            </div>

            {/* Expansion table showing claim items in create mode */ }
            <EditableExpansionTable data={ claimFormData.claimItems } onClaimItemsUpdate={ onClaimItemsUpdate }
                                    mode="create"/>

        </div>
    )
}

export default AddExpenseForm