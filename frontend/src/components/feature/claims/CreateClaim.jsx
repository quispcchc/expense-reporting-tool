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
import MileageSection from '../mileage/MileageSection.jsx'
import api from '../../../api/api.js'

const calculateTotalAmount = (formData, mileageData, includeMileage) => {
    // Expense totals (mileage amounts are already included in expense amount when bound)
    const claimItemsTotal = formData.claimItems.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
    )
    // Only count unbound mileage (transactions still in the mileage section, not yet added to an expense)
    const unboundMileageTotal = includeMileage
        ? (mileageData.transactions || []).reduce(
            (sum, tx) => sum + (parseFloat(tx.total_amount) || 0),
            0,
        )
        : 0
    return claimItemsTotal + unboundMileageTotal
}

function CreateClaim({ navigateTo, homePath, toastRef }) {
    const { t } = useTranslation()
    const { authUser } = useAuth()
    const { createClaim } = useClaims()
    const navigate = useNavigate()

    const [tags, setTags] = useState([])
    const [files, setFiles] = useState([])

    const [expenseErrors, setExpenseErrors] = useState([])
    const [claimErrors, setClaimErrors] = useState()
    const [validationDialog, setValidationDialog] = useState({ visible: false, header: '', message: '' })

    // Mileage state
    const [includeMileage, setIncludeMileage] = useState(false)
    const [mileageRate, setMileageRate] = useState(0.5)
    const initialMileageData = {
        travel_from: '',
        travel_to: '',
        period_of_from: '',
        period_of_to: '',
        transactions: [],
    }
    const [mileageData, setMileageData] = useState(initialMileageData)

    // Fetch mileage rate from settings on mount
    useEffect(() => {
        const fetchMileageRate = async () => {
            try {
                const response = await api.get('settings')
                if (response.data?.mileage_rate !== undefined) {
                    setMileageRate(parseFloat(response.data.mileage_rate))
                }
            } catch (error) {
                console.error('Failed to fetch mileage rate:', error)
            }
        }
        fetchMileageRate()
    }, [])

    const handleMileageToggle = (checked) => {
        setIncludeMileage(checked)
        if (!checked) {
            setMileageData(initialMileageData)
        }
    }

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
    }, [claimFormData, expenseFormData, tags])

    // Auto-fill expense form amount from mileage total when mileage transactions change
    const currentMileageTotal = includeMileage
        ? (mileageData.transactions || []).reduce((sum, tx) => sum + (parseFloat(tx.total_amount) || 0), 0)
        : 0

    useEffect(() => {
        if (includeMileage && mileageData.transactions?.length > 0) {
            const firstTx = mileageData.transactions[0]
            setExpenseFormData(prev => ({
                ...prev,
                amount: currentMileageTotal.toFixed(2),
                // Auto-fill buyer from first transaction if expense buyer is empty
                ...(prev.buyer === '' && firstTx?.buyer ? { buyer: firstTx.buyer } : {}),
                // Auto-fill date from first transaction if expense date is empty
                ...(prev.transactionDate === '' && firstTx?.transaction_date ? { transactionDate: firstTx.transaction_date } : {}),
            }))
        }
    }, [includeMileage, currentMileageTotal])

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
            // Bind mileage data to this expense if mileage is active with transactions
            ...(includeMileage && mileageData.transactions?.length > 0 ? {
                mileage: {
                    travel_from: mileageData.travel_from,
                    travel_to: mileageData.travel_to,
                    period_of_from: mileageData.period_of_from,
                    period_of_to: mileageData.period_of_to,
                    transactions: [...mileageData.transactions],
                }
            } : {}),
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
        setTags([])

        // Reset mileage data after binding to expense
        if (includeMileage && mileageData.transactions?.length > 0) {
            setMileageData(initialMileageData)
        }
    }

    const handleClaimSubmit = async (e) => {
        e.preventDefault()
        const claimSchema = validationSchemas.claim
        const validation = validateForm(claimFormData, claimSchema)
        setClaimErrors(validation.errors)

        const hasExpenses = claimFormData.claimItems.length > 0
        const hasUnboundMileage = includeMileage && (mileageData.transactions || []).length > 0

            // Mileage must be bound to an expense before submitting
        if (hasUnboundMileage) {
            setValidationDialog({
                visible: true,
                header: t('validation.confirmationRequired', 'Confirmation Required'),
                message: t('validation.unboundMileage', 'You have mileage transactions that are not yet added to an expense. Please click "Add Expense" to include them before submitting.')
            })
            return
        }
        if (!hasExpenses) {
            setValidationDialog({
                visible: true,
                header: t('validation.confirmationRequired', 'Confirmation Required'),
                message: t('validation.noItems', 'Please add at least one expense before submitting.')
            })
            return
        }

    

        if (!validation.isValid) {
            setValidationDialog({
                visible: true,
                header: t('validation.error', 'Validation Error'),
                message: t('validation.fillRequired', 'Please fill in all required fields!')
            })
            return
        }

        const totalAmount = calculateTotalAmount(claimFormData, mileageData, includeMileage)

        const formData = new FormData()

        // Add claim fields
        formData.append('position_id', claimFormData.position)
        formData.append('claim_type_id', claimFormData.claimType)
        formData.append('department_id', claimFormData.department)
        formData.append('team_id', claimFormData.team)
        formData.append('claim_notes', claimFormData.note)
        formData.append('total_amount', totalAmount)

        // Add expenses - properly handling files
        claimFormData.claimItems.forEach((expense, index) => {

            // Add all non-file fields
            formData.append(`expenses[${index}][transaction_date]`, expense.transactionDate)
            formData.append(`expenses[${index}][buyer_name]`, expense.buyer)
            formData.append(`expenses[${index}][vendor_name]`, expense.vendor)
            formData.append(`expenses[${index}][transaction_desc]`, expense.description)
            formData.append(`expenses[${index}][expense_amount]`, expense.amount)
            formData.append(`expenses[${index}][project_id]`, expense.program)
            formData.append(`expenses[${index}][cost_centre_id]`, expense.costCentre)
            formData.append(`expenses[${index}][account_number_id]`, expense.accountNum)
            // Send tags as an array of tag IDs
            if (Array.isArray(expense.tags)) {
                expense.tags.forEach((tagId, tagIdx) => {
                    formData.append(`expenses[${index}][tags][${tagIdx}]`, typeof tagId === 'object' ? tagId.tag_id : tagId)
                })
            } else if (expense.tags) {
                formData.append(`expenses[${index}][tags][0]`, typeof expense.tags === 'object' ? expense.tags.tag_id : expense.tags)
            }
            formData.append(`expenses[${index}][transaction_notes]`, expense.notes)

            // MULTIPLE ATTACHMENTS: { attachment: [{file, url}] }
            if (Array.isArray(expense.attachment) && expense.attachment.length > 0) {
                expense.attachment.forEach((att, attIndex) => {
                    if (att?.file instanceof File) {
                        const fieldName = `expenses[${index}][file][${attIndex}]`
                        formData.append(fieldName, att.file)
                    }
                })
            }

            // Mileage nested inside the expense that owns it
            if (expense.mileage?.transactions?.length > 0) {
                const mil = expense.mileage
                formData.append(`expenses[${index}][mileage][travel_from]`, mil.travel_from)
                formData.append(`expenses[${index}][mileage][travel_to]`, mil.travel_to)
                formData.append(`expenses[${index}][mileage][period_of_from]`, mil.period_of_from)
                formData.append(`expenses[${index}][mileage][period_of_to]`, mil.period_of_to)

                mil.transactions.forEach((tx, txIdx) => {
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][transaction_date]`, tx.transaction_date)
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][distance_km]`, tx.distance_km)
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][meter_km]`, tx.meter_km ?? '')
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][parking_amount]`, tx.parking_amount ?? '')
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][buyer]`, tx.buyer ?? '')

                    if (Array.isArray(tx.attachment) && tx.attachment.length > 0) {
                        tx.attachment.forEach((att, attIdx) => {
                            if (att?.file instanceof File) {
                                formData.append(`expenses[${index}][mileage][transactions][${txIdx}][file][${attIdx}]`, att.file)
                            }
                        })
                    }
                })
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

    const totalAmount = calculateTotalAmount(claimFormData, mileageData, includeMileage)

    return (
        <form onSubmit={handleClaimSubmit}>
            <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <ContentHeader title={t('claims.createClaim')} homePath={homePath} className="" iconKey="claims.createClaim" />
                <div className="flex gap-5 items-center">
                    <div className="flex flex-col items-end">
                        <p className="text-lg font-medium">{t('claims.totalAmount')}</p>
                        <p className="text-blue-500 text-xl">${totalAmount.toFixed(2)}</p>
                    </div>
                    <Button label={t('claims.submitClaim', 'Submit claim')} type="submit" icon="pi pi-plus"
                        iconPos="right" />
                </div>
            </div>

            <div className="mt-4">
                <ClaimForm claimFormData={claimFormData} onFieldChange={handleFormFieldChange}
                    errors={claimErrors}
                    includeMileage={includeMileage} onMileageToggle={handleMileageToggle} />
            </div>


            {includeMileage && (
                <div className="mt-6">
                    <MileageSection
                        mileageData={mileageData}
                        setMileageData={setMileageData}
                        mileageRate={mileageRate}
                        toastRef={toastRef}
                    />
                </div>
            )}

            <div className="mt-6">
                <AddExpenseForm claimFormData={claimFormData} onClaimItemsUpdate={handleClaimItemsUpdate}
                    expenseFormData={expenseFormData} onSetExpenseForm={setExpenseFormData}
                    onExpenseChange={handleExpenseFieldChange}
                    onAddExpense={handleAddExpense} tags={tags} onSetTags={setTags} files={files}
                    onSetFiles={setFiles} errors={expenseErrors}
                    toastRef={toastRef}
                    includeMileage={includeMileage}
                    mileageData={mileageData}
                />
            </div>


            <Dialog header={validationDialog.header} visible={validationDialog.visible} style={{ width: '90vw', maxWidth: '450px' }}
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