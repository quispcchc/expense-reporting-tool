import React, { useEffect } from 'react'
import { useTags } from '../../../contexts/TagContext.jsx'
import UploadAttachment from './uploadAttchment/UploadAttachment.jsx'
import TagMultiSelect from './TagMultiSelect.jsx'
import { Button } from 'primereact/button'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import EditableExpansionTable from './expansionTable/EditableExpansionTable.jsx'
import { autoFillForm } from '../../../utils/helpers.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'


function AddExpenseForm({
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
    toastRef
}) {
    const { t } = useTranslation()
    const { lookups: { costCentres, projects, accountNums } } = useLookups()

    return (
        <div className="bg-white h-full rounded-2xl shadow-sm">
            <div className={`flex justify-between items-center rounded-t-2xl p-6 bg-brand-light`}>
                <div>
                    <p className="text-xl font-semibold text-text-primary">{t('expenses.addExpense')}</p>
                    <p className="text-text-secondary text-sm">{t('expenses.addExpenseDescription')}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-text-secondary">{t('claims.totalAmount')}</p>
                    <p className="text-2xl font-bold text-brand-primary">
                        ${claimFormData.claimItems?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2) || '0.00'}
                    </p>
                </div>

            </div>

            {/* Main form content split into two columns */}
            <div className="flex justify-between my-5 gap-10 flex-wrap px-6">

                {/* Left column with input fields */}
                <div className="flex-1">
                    <div className="flex flex-col gap-3">

                        {/* Program select dropdown */}
                        <Select name="program" id="program" label={t('expenses.program')} value={expenseFormData.program}
                            onChange={onExpenseChange}
                            options={projects.map(opt => ({
                                label: `${opt.project_name} - ${opt.project_desc}`,
                                value: opt.project_id,
                            }))}
                            placeholder={t('expenses.selectProgram', 'Select a program')}
                            errors={errors} />

                        {/* Transaction date input */}
                        <Input name="transactionDate" id="transactionDate" label={t('expenses.transactionDate') + '*'}
                            value={expenseFormData.transactionDate} type="date"
                            onChange={onExpenseChange}
                            placeholder={t('expenses.selectTransactionDate', 'Select a transaction date')}
                            errors={errors} />

                        {/* Cost Centre select dropdown, mapped to label and value */}
                        <Select name="costCentre" id="costCentre" label={t('expenses.costCentre')}
                            value={expenseFormData.costCentre}
                            onChange={onExpenseChange}
                            options={costCentres.map((opt) => ({
                                label: `${opt.cost_centre_code} - ${opt.description}`,
                                value: opt.cost_centre_id,
                            }))}
                            placeholder={t('expenses.selectCostCentre', 'Select a cost centre')}
                            errors={errors} />

                        {/* Vendor / Service Provider input */}
                        <Input name="vendor" id="vendor" label={t('expenses.vendor')}
                            value={expenseFormData.vendor}
                            onChange={onExpenseChange}
                            placeholder={t('expenses.enterVendor', 'Enter vendor name')}
                            errors={errors} />

                        {/* Account Number select dropdown, mapped to label and value */}
                        <Select name="accountNum" id="accountNum" label={t('expenses.accountNumber')}
                            value={expenseFormData.accountNum}
                            onChange={onExpenseChange}
                            options={accountNums.map((opt) => ({
                                label: `${opt.account_number} - ${opt.description}`,
                                value: opt.account_number_id,
                            }))}
                            placeholder={t('expenses.selectAccountNumber', 'Select an Account Number')}
                            errors={errors} />

                        {/* Amount and Buyer inputs side by side */}
                        <div className="flex justify-between flex-wrap gap-3">
                            <div className="flex-1">
                                <Input name="amount" id="amount" label={t('expenses.amount')}
                                    value={expenseFormData.amount}
                                    onChange={onExpenseChange}
                                    placeholder={t('expenses.enterAmount', 'Please enter amount')}
                                    errors={errors} />
                            </div>
                            <div className="flex-1">
                                <Input name="buyer" id="buyer" label={t('expenses.buyer')}
                                    value={expenseFormData.buyer}
                                    onChange={onExpenseChange}
                                    placeholder={t('expenses.enterBuyer', 'Please enter buyer')}
                                    errors={errors} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column with description, notes, attachments, and tags */}
                <div className="flex-1">

                    {/* Expense Description textarea */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2">{t('expenses.description')}</label>
                        <textarea
                            placeholder={t('expenses.descriptionPlaceholder', 'Describe the purpose of this expense...')}
                            name="description"
                            value={expenseFormData.description}
                            rows="3"
                            className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                            onChange={onExpenseChange}
                        />
                    </div>

                    {/* Notes textarea */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2">{t('expenses.notes')}</label>
                        <textarea
                            name="notes"
                            rows="3"
                            onChange={onExpenseChange}
                            value={expenseFormData.notes}
                            placeholder={t('expenses.notesPlaceholder', 'Add any additional notes...')}
                            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />
                    </div>

                    {/* File upload component */}
                    <UploadAttachment files={files} onSetFiles={onSetFiles} errors={errors} />


                    {/* Tag multi-select component */}
                    <TagMultiSelect value={tags} onChange={onSetTags} />

                </div>
            </div>

            {/* Buttons for adding expense and autofill form (autofill:for quick test) */}
            <div className="flex justify-end gap-2 p-5">
                <Button label={t('expenses.addExpense')} type="button" icon="pi pi-check" iconPos="right"
                    onClick={onAddExpense} />
                <Button label={t('common.autoFill', 'Auto Fill Form')} type="button" onClick={() => autoFillForm(onSetExpenseForm)} />
            </div>

            {/* Expansion table showing claim items in create mode */}
            <EditableExpansionTable data={claimFormData.claimItems} onClaimItemsUpdate={onClaimItemsUpdate}
                mode="create" toastRef={toastRef} />

        </div>
    )
}

export default AddExpenseForm