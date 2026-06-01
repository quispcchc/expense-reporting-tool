import AddExpenseForm from './AddExpenseForm.jsx'
import EditableExpansionTable from './expansionTable/EditableExpansionTable.jsx'
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
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { showToast } from '../../../utils/helpers.js'
import { useTranslation } from 'react-i18next'
import MileageSection from '../mileage/MileageSection.jsx'
import Select from '../../common/ui/Select.jsx'
import Input from '../../common/ui/Input.jsx'
import api from '../../../api/api.js'
import { CLAIM_TYPE, VIEW_MODE } from '../../../config/constants.js'

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

    const [bankStatementFile, setBankStatementFile] = useState(null)
    const [isExtracting, setIsExtracting] = useState(false)

    const { lookups: { costCentres, projects, accountNums } } = useLookups()

    // Default field values applied to every expense row for corporate card claims.
    const [cardDefaults, setCardDefaults] = useState({ costCentre: '', accountNum: '', program: '', buyer: '' })

    const [expenseErrors, setExpenseErrors] = useState([])
    const [claimErrors, setClaimErrors] = useState()
    const [mileageHeaderErrors, setMileageHeaderErrors] = useState({})
    const [validationDialog, setValidationDialog] = useState({ visible: false, header: '', message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

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
        let cancelled = false
        const fetchRate = async () => {
            try {
                const response = await api.get('settings')
                if (!cancelled && response.data?.mileage_rate !== undefined) {
                    setMileageRate(parseFloat(response.data.mileage_rate))
                }
            } catch {
                // Error handled by caller
            }
        }
        fetchRate()
        return () => { cancelled = true }
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

    const isCorporateCard = Number(claimFormData.claimType) === CLAIM_TYPE.CORPORATE_CARD

    // When a default field changes, update the stored default AND overwrite that
    // field on every existing expense row so the table reflects it immediately.
    const handleCardDefaultChange = (e) => {
        const { name, value } = e.target
        setCardDefaults(prev => ({ ...prev, [name]: value }))
        setClaimFormData(prev => ({
            ...prev,
            claimItems: prev.claimItems.map(item => ({ ...item, [name]: value })),
        }))
    }

    const handleBankStatementUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setBankStatementFile(file)
        setIsExtracting(true)
        try {
            const formData = new FormData()
            formData.append('bank_statement', file)
            const response = await api.post('bank-statements/extract', formData)
            const extracted = response.data?.expenses || []
            const refunds = response.data?.refunds || []
            const paired = response.data?.paired || 0
            const claimItems = extracted.map(exp => ({
                program: cardDefaults.program || exp.project_id || '',
                transactionDate: exp.transaction_date || '',
                costCentre: cardDefaults.costCentre || exp.cost_centre_id || '',
                vendor: exp.vendor_name || '',
                accountNum: cardDefaults.accountNum || exp.account_number_id || '',
                amount: exp.expense_amount || '',
                buyer: cardDefaults.buyer || exp.buyer_name || '',
                description: exp.transaction_desc || '',
                notes: exp.transaction_notes || '',
                tags: [],
                attachment: [],
            }))
            setClaimFormData(prev => ({ ...prev, claimItems }))

            // Build a refund-aware success message.
            let detail = t(
                'claimForm.extractionSuccess',
                `Extracted ${claimItems.length} expense(s) from bank statement`,
                { count: claimItems.length },
            )
            if (paired > 0) {
                detail += ` · ${paired} refund${paired === 1 ? '' : 's'} cancelled matching purchase${paired === 1 ? '' : 's'}`
            }
            showToast(toastRef, {
                severity: 'success',
                summary: t('common.success'),
                detail,
                life: 6000,
            })

            // Surface unmatched refunds separately so the user can manually
            // reconcile them against their previous claims.
            if (refunds.length > 0) {
                const refundList = refunds
                    .map(r => `${r.transaction_date} ${r.vendor_name} ${r.expense_amount}`)
                    .join(' · ')
                showToast(toastRef, {
                    severity: 'warn',
                    summary: t('claimForm.unmatchedRefunds', 'Unmatched refunds'),
                    detail: t(
                        'claimForm.unmatchedRefundsDetail',
                        `${refunds.length} refund(s) on this statement could not be matched to a purchase. Please verify: ${refundList}`,
                        { count: refunds.length, list: refundList },
                    ),
                    life: 12000,
                    sticky: true,
                })
            }
        } catch (err) {
            // 422 indicates the file was accepted but can't be auto-extracted
            // (e.g. image upload). The file is still kept and will be saved
            // with the claim on submit, so this is informational, not fatal.
            const status = err?.response?.status
            const serverMessage = err?.response?.data?.message || err?.message
            const isExtractionUnavailable = status === 422
            showToast(toastRef, {
                severity: isExtractionUnavailable ? 'warn' : 'error',
                summary: isExtractionUnavailable ? t('common.warning', 'Warning') : t('common.error'),
                detail: serverMessage || t('claimForm.extractionError', 'Failed to extract expenses from bank statement. Please try again.'),
                life: 6000,
            })
        } finally {
            setIsExtracting(false)
        }
    }

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeMileage, currentMileageTotal])

    const handleFormFieldChange = (e) => {
        const { name, value } = e.target
        setClaimFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'claimType' ? { claimItems: [] } : {}),
        }))
        if (name === 'claimType') {
            setBankStatementFile(null)
            setCardDefaults({ costCentre: '', accountNum: '', program: '', buyer: '' })
        }
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

        // Validate mileage header (period dates) when binding mileage to an expense
        let mileageHeaderValid = true
        if (includeMileage && mileageData.transactions?.length > 0) {
            const headerValidation = validateForm(
                { period_of_from: mileageData.period_of_from, period_of_to: mileageData.period_of_to },
                validationSchemas.mileageHeader,
            )
            setMileageHeaderErrors(headerValidation.errors)
            mileageHeaderValid = headerValidation.isValid
        } else {
            setMileageHeaderErrors({})
        }

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

        if (!validation.isValid || !mileageHeaderValid) {
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
        if (isCorporateCard && bankStatementFile) {
            formData.append('bank_statement', bankStatementFile)
        }

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
                formData.append(`expenses[${index}][mileage][period_of_from]`, mil.period_of_from)
                formData.append(`expenses[${index}][mileage][period_of_to]`, mil.period_of_to)

                mil.transactions.forEach((tx, txIdx) => {
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][transaction_date]`, tx.transaction_date)
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][travel_from]`, tx.travel_from ?? '')
                    formData.append(`expenses[${index}][mileage][transactions][${txIdx}][travel_to]`, tx.travel_to ?? '')
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
            setIsSubmitting(true)
            await createClaim(formData)
            setTags([])
            setFiles([])
            navigate(navigateTo, { state: { flashMessage: t('claims.submitSuccess') } })
        } catch (error) {
            const detail = error?.message || t('claims.submitError')
            showToast(toastRef, { severity: 'error', summary: t('claims.submitFailed'), detail })
        } finally {
            setIsSubmitting(false)
        }

    }

    const totalAmount = calculateTotalAmount(claimFormData, mileageData, includeMileage)

    return (
        <form onSubmit={handleClaimSubmit}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-0 sm:mb-4">
                <ContentHeader title={t('claims.createClaim')} homePath={homePath} className="" iconKey="claims.createClaim" />
                <div className="flex flex-row justify-between sm:justify-end items-center gap-4 w-full sm:w-auto bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-gray-100">
                    <div className="flex flex-col items-start sm:items-end">
                        <p className="text-sm font-medium text-gray-500">{t('claims.totalAmount', 'Amount')}</p>
                        <p className="text-blue-500 text-xl sm:text-2xl font-semibold -mt-1">${totalAmount.toFixed(2)}</p>
                    </div>
                    <Button label={t('claims.submitClaim', 'Submit claim')} type="submit" icon="pi pi-plus"
                        iconPos="right" loading={isSubmitting} disabled={isSubmitting} className="flex-1 sm:flex-none sm:w-auto w-full mobile-wrap-text-btn" />
                </div>
            </div>

            <div className="mt-4">
                <ClaimForm claimFormData={claimFormData} onFieldChange={handleFormFieldChange}
                    errors={claimErrors}
                    includeMileage={includeMileage}
                    onMileageToggle={isCorporateCard ? undefined : handleMileageToggle}
                    onBankStatementUpload={handleBankStatementUpload}
                    isExtracting={isExtracting}
                    bankStatementFile={bankStatementFile}
                />
            </div>

            {!isCorporateCard && includeMileage && (
                <div className="mt-6">
                    <MileageSection
                        mileageData={mileageData}
                        setMileageData={setMileageData}
                        mileageRate={mileageRate}
                        toastRef={toastRef}
                        headerErrors={mileageHeaderErrors}
                    />
                </div>
            )}

            {isCorporateCard && (
                <div className="mt-4 bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-4">
                        {t('claimForm.cardDefaults', 'Default values for all expense rows')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select
                            name="program"
                            label={t('expenses.program', 'Program')}
                            value={cardDefaults.program}
                            onChange={handleCardDefaultChange}
                            options={projects.map(p => ({ label: `${p.project_name} - ${p.project_desc}`, value: p.project_id }))}
                            placeholder={t('expenses.selectProgram', 'Select program')}
                        />
                        <Select
                            name="costCentre"
                            label={t('expenses.costCentre', 'Cost Centre')}
                            value={cardDefaults.costCentre}
                            onChange={handleCardDefaultChange}
                            options={costCentres.map(c => ({ label: `${c.cost_centre_code} - ${c.description}`, value: c.cost_centre_id }))}
                            placeholder={t('expenses.selectCostCentre', 'Select cost centre')}
                        />
                        <Select
                            name="accountNum"
                            label={t('expenses.accountNumber', 'Account Number')}
                            value={cardDefaults.accountNum}
                            onChange={handleCardDefaultChange}
                            options={accountNums.map(a => ({ label: `${a.account_number} - ${a.description}`, value: a.account_number_id }))}
                            placeholder={t('expenses.selectAccountNumber', 'Select account number')}
                        />
                        <Input
                            name="buyer"
                            label={t('expenses.buyer', 'Buyer')}
                            value={cardDefaults.buyer}
                            onChange={handleCardDefaultChange}
                            placeholder={t('expenses.buyerPlaceholder', 'Enter buyer name')}
                        />
                    </div>
                </div>
            )}


            {/* <div className="mt-6">
                {isCorporateCard ? (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <EditableExpansionTable
                            data={claimFormData.claimItems}
                            onClaimItemsUpdate={handleClaimItemsUpdate}
                            mode={VIEW_MODE.CREATE}
                            toastRef={toastRef}
                        />
                    </div>
                ) : (
                    <AddExpenseForm claimFormData={claimFormData} onClaimItemsUpdate={handleClaimItemsUpdate}
                        expenseFormData={expenseFormData} onSetExpenseForm={setExpenseFormData}
                        onExpenseChange={handleExpenseFieldChange}
                        onAddExpense={handleAddExpense} tags={tags} onSetTags={setTags} files={files}
                        onSetFiles={setFiles} errors={expenseErrors}
                        toastRef={toastRef}
                        includeMileage={includeMileage}
                        mileageData={mileageData}
                    />
                )}
            </div> */}

            <div className="mt-6">
                <AddExpenseForm claimFormData={claimFormData} onClaimItemsUpdate={handleClaimItemsUpdate}
                    expenseFormData={expenseFormData} onSetExpenseForm={setExpenseFormData}
                    onExpenseChange={handleExpenseFieldChange}
                    onAddExpense={handleAddExpense} tags={tags} onSetTags={setTags} files={files}
                    onSetFiles={setFiles} errors={expenseErrors}
                    toastRef={toastRef}
                    includeMileage={includeMileage}
                    mileageData={mileageData}
                    bankStatementFile={bankStatementFile}
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
