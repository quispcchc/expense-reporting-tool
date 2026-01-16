import AddExpenseForm from './AddExpenseForm.jsx'
import { useEffect, useState } from 'react'
import ContentHeader from '../../common/layout/ContentHeader.jsx'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import ClaimForm from './ClaimForm.jsx'
import { validateForm } from '../../../utils/validation/validator.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { useNavigate } from 'react-router-dom'
import { useClaims } from '../../../contexts/ClaimContext.jsx'
import { useAuth } from '../../../contexts/AuthContext.jsx'
import { showToast } from '../../../utils/helpers.js'
import { useTranslation } from 'react-i18next'

const calculateTotalAmount = (formData) => {
    const claimItemsTotal = formData.claimItems.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
    )
    return claimItemsTotal
}

function CreateClaim({ navigateTo, homePath, toastRef }) {
    const { t } = useTranslation()
    const { authUser } = useAuth()
    const { createClaim } = useClaims()
    const navigate = useNavigate()

    const [tags, setTags] = useState(['Client Travelling'])
    const [files, setFiles] = useState([])

    const [expenseErrors, setExpenseErrors] = useState([])
    const [claimErrors, setClaimErrors] = useState()
    const [validationDialog, setValidationDialog] = useState({ visible: false, header: '', message: '' })

    const initialClaimFormData = {
        employeeName: authUser.full_name,
        position: authUser.position_id,
        claimType: '',
        note: '',
        department: authUser.department_id,
        team: null,
        claimItems: [],
    }
    const [claimFormData, setClaimFormData] = useState(initialClaimFormData)

    const initialExpenseFormData = {
        program: '',
        transactionDate: '',
        costCentre: '',
        vendor: '',
        accountNum: '',
        amount: '',
        buyer: '',
        description: '',
        notes: '',
    }

    const [expenseFormData, setExpenseFormData] = useState(initialExpenseFormData)

    useEffect(() => {
        console.log('claimFormData', claimFormData)
        console.log('expenseFormData', expenseFormData)
    }, [claimFormData, expenseFormData, tags])

    const handleFormFieldChange = (e) => {
        const { name, value } = e.target
        setClaimFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleExpenseFieldChange = (e) => {
        const { name, value } = e.target
        setExpenseFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleClaimItemsUpdate = (updatedClaimItems) => {
        setClaimFormData(prev => ({
            ...prev,
            claimItems: updatedClaimItems,
        }))
    }

    const handleAddExpense = () => {
        const expenseSchema = validationSchemas.expense
        const validation = validateForm(expenseFormData, expenseSchema)
        setExpenseErrors(validation.errors)

        // files is already an array of {file, url} objects
        const completeExpenseData = {
            ...expenseFormData,
            tags: [...tags],
            attachment: files, // Use files array directly
        }

        if (!validation.isValid) {
            setValidationDialog({
                visible: true,
                header: t('validation.error', 'Validation Error'),
                message: t('validation.fillRequired', 'Please fill in all required fields!')
            })
            return
        }

        setClaimFormData(prev => ({
            ...prev,
            claimItems: [...prev.claimItems, completeExpenseData],
        }))

        // Reset form data and files after adding expense
        setExpenseFormData(initialExpenseFormData)
        setFiles([])
        setTags(['Client Travelling'])

    }

    const handleClaimSubmit = async (e) => {
        e.preventDefault()
        const claimSchema = validationSchemas.claim
        const validation = validateForm(claimFormData, claimSchema)
        setClaimErrors(validation.errors)

        if (claimFormData.claimItems.length <= 0) {
            if (claimFormData.claimItems.length <= 0) {
                setValidationDialog({
                    visible: true,
                    header: t('validation.confirmationRequired', 'Confirmation Required'),
                    message: t('validation.noExpenseItems', 'No expense items found. Please add at least one expense before submitting.')
                })
                return
            }
        }

        if (!validation.isValid) {
            setValidationDialog({
                visible: true,
                header: t('validation.error', 'Validation Error'),
                message: t('validation.fillRequired', 'Please fill in all required fields!')
            })
            return
        }

        const formData = new FormData()

        // Add claim fields
        formData.append('position_id', claimFormData.position)
        formData.append('claim_type_id', claimFormData.claimType)
        formData.append('department_id', claimFormData.department)
        formData.append('team_id', claimFormData.team)
        formData.append('claim_notes', claimFormData.note)
        formData.append('total_amount', calculateTotalAmount(claimFormData))

        // Add expenses - properly handling files
        claimFormData.claimItems.forEach((expense, index) => {
            console.log('📦 Processing expense', index, expense)
            console.log('📎 Attachments:', expense.attachment)

            // Add all non-file fields
            formData.append(`expenses[${index}][transaction_date]`, expense.transactionDate)
            formData.append(`expenses[${index}][buyer_name]`, expense.buyer)
            formData.append(`expenses[${index}][vendor_name]`, expense.vendor)
            formData.append(`expenses[${index}][transaction_desc]`, expense.description)
            formData.append(`expenses[${index}][expense_amount]`, expense.amount)
            formData.append(`expenses[${index}][project_id]`, expense.program)
            formData.append(`expenses[${index}][cost_centre_id]`, expense.costCentre)
            formData.append(`expenses[${index}][account_number_id]`, expense.accountNum)
            formData.append(`expenses[${index}][tags]`, expense.tags)
            formData.append(`expenses[${index}][transaction_notes]`, expense.notes)

            // MULTIPLE ATTACHMENTS: { attachment: [{file, url}] }
            if (Array.isArray(expense.attachment) && expense.attachment.length > 0) {
                console.log('✅ Found', expense.attachment.length, 'attachments')
                expense.attachment.forEach((att, attIndex) => {
                    console.log(`  [${attIndex}] Attachment:`, att?.file instanceof File ? 'File object ✓' : 'Not a file ✗', att)
                    if (att?.file instanceof File) {
                        const fieldName = `expenses[${index}][file][${attIndex}]`
                        formData.append(fieldName, att.file)
                        console.log(`  ✅ Appended file to FormData as: ${fieldName}`)
                    }
                })
            } else {
                console.log('⚠️ No attachments for this expense')
            }
        })

        try {
            await createClaim(formData)
            setTags([])
            setFiles([])
            navigate(navigateTo, { state: { flashMessage: t('claims.submitSuccess') } })
        } catch (error) {
            const detail = error?.message || 'Failed to submit claim'
            showToast(toastRef, { severity: 'error', summary: 'Submit failed', detail })
        }

    }

    return (
        <form onSubmit={handleClaimSubmit}>
            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <ContentHeader title={t('claims.createClaim')} homePath={homePath} className="" iconKey="claims.createClaim" />
                <div className="flex gap-5 items-center">
                    <div className="flex flex-col items-end">
                        <p className="text-lg font-medium">{t('claims.totalAmount')}</p>
                        <p className="text-blue-500 text-xl">${calculateTotalAmount(claimFormData).toFixed(2)}</p>
                    </div>
                    <Button label={t('claims.submitClaim', 'Submit claim')} type="submit" icon="pi pi-plus"
                        iconPos="right" />
                </div>
            </div>

            <div className="mt-4">
                <ClaimForm claimFormData={claimFormData} onFieldChange={handleFormFieldChange}
                    errors={claimErrors} />
            </div>
            <div className="mt-6">
                <AddExpenseForm claimFormData={claimFormData} onClaimItemsUpdate={handleClaimItemsUpdate}
                    expenseFormData={expenseFormData} onSetExpenseForm={setExpenseFormData}
                    onExpenseChange={handleExpenseFieldChange}

                    onAddExpense={handleAddExpense} tags={tags} onSetTags={setTags} files={files}
                    onSetFiles={setFiles} errors={expenseErrors}
                    toastRef={toastRef}
                />
            </div>
            <Dialog header={validationDialog.header} visible={validationDialog.visible} style={{ width: '450px' }}
                onHide={() => setValidationDialog(prev => ({ ...prev, visible: false }))}
                footer={
                    <Button label={t('common.ok')} icon="pi pi-check" onClick={() => setValidationDialog(prev => ({ ...prev, visible: false }))}
                        autoFocus />
                }>
                <p className="m-0">
                    {validationDialog.message}
                </p>
            </Dialog>
        </form>

    )
}

export default CreateClaim