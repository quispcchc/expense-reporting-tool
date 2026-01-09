import AddExpenseForm from './AddExpenseForm.jsx'
import { useEffect, useState } from 'react'
import ContentHeader from '../../common/layout/ContentHeader.jsx'
import { Button } from 'primereact/button'
import ClaimForm from './ClaimForm.jsx'
import { validateForm } from '../../../utils/validation/validator.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { useNavigate } from 'react-router-dom'
import { useClaims } from '../../../contexts/ClaimContext.jsx'
import { useAuth } from '../../../contexts/AuthContext.jsx'

const calculateTotalAmount = (formData) => {
    const claimItemsTotal = formData.claimItems.reduce(
        (sum, item) => sum + ( parseFloat(item.amount) || 0 ),
        0,
    )
    return claimItemsTotal
}

function CreateClaim ({ navigateTo, homePath, toastRef }) {
    const { authUser } = useAuth()
    const { createClaim } = useClaims()
    const navigate = useNavigate()

    const [tags, setTags] = useState(['Client Travelling'])
    const [files, setFiles] = useState([])

    const [expenseErrors, setExpenseErrors] = useState([])
    const [claimErrors, setClaimErrors] = useState()

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
        setClaimFormData(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    const handleExpenseFieldChange = (e) => {
        const { name, value } = e.target
        setExpenseFormData(prev => ( {
            ...prev,
            [ name ]: value,
        } ))
    }

    const handleClaimItemsUpdate = (updatedClaimItems) => {
        setClaimFormData(prev => ( {
            ...prev,
            claimItems: updatedClaimItems,
        } ))
    }

    const handleAddExpense = () => {
        const expenseSchema = validationSchemas.expense
        const validation = validateForm(expenseFormData, expenseSchema)
        setExpenseErrors(validation.errors)

        const completeExpenseData = {
            ...expenseFormData,
            tags: [...tags],
            attachment: [...files],
        }
        if (!validation.isValid) return alert('Please fill in all required fields!')

        setClaimFormData(prev => ( {
            ...prev,
            claimItems: [...prev.claimItems, completeExpenseData],
        } ))

    }

    const handleClaimSubmit = async(e) => {
        e.preventDefault()
        const claimSchema = validationSchemas.claim
        const validation = validateForm(claimFormData, claimSchema)
        setClaimErrors(validation.errors)

        if (claimFormData.claimItems.length <= 0) return alert('please add at least one expense!')

        if (!validation.isValid) return alert('Please fill in all required fields!')

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
            console.log('expense', expense)
            // Add all non-file fields
            formData.append(`expenses[${ index }][transaction_date]`, expense.transactionDate)
            formData.append(`expenses[${ index }][buyer_name]`, expense.buyer)
            formData.append(`expenses[${ index }][vendor_name]`, expense.vendor)
            formData.append(`expenses[${ index }][transaction_desc]`, expense.description)
            formData.append(`expenses[${ index }][expense_amount]`, expense.amount)
            formData.append(`expenses[${ index }][project_id]`, expense.program)
            formData.append(`expenses[${ index }][cost_centre_id]`, expense.costCentre)
            formData.append(`expenses[${ index }][account_number_id]`, expense.accountNum)
            formData.append(`expenses[${ index }][tags]`, expense.tags)
            formData.append(`expenses[${ index }][transaction_notes]`, expense.notes)

            // Only add file if it's a real File object
            // if (expense.attachment.file instanceof File) {
            //     formData.append(`expenses[${ index }][file]`, expense.attachment.file)
            // }

            // MULTIPLE ATTACHMENTS: { attachment: [{file, url}] }
            if (Array.isArray(expense.attachment)) {
                expense.attachment.forEach((att, attIndex) => {
                    // only append if there's an actual File object
                    if (att?.file instanceof File) {
                        formData.append(
                            `expenses[${index}][file][${attIndex}]`,
                            att.file
                        )
                    }
                })
            }
        })

        await createClaim(formData)

        setClaimFormData(initialClaimFormData)
        setExpenseFormData(initialExpenseFormData)
        setTags([])
        setFiles([])
        navigate(navigateTo)

    }

    return (
        <form className="my-3" onSubmit={ handleClaimSubmit }>
            <div className="flex justify-between items-center flex-wrap">
                <ContentHeader title="Create a new claim" homePath={ homePath }/>
                <div className="flex gap-5">
                    <div className="flex flex-col items-end">
                        <p className="text-2xl">Total amount</p>
                        <p className="text-blue-500">${ calculateTotalAmount(claimFormData).toFixed(2) }</p>
                    </div>
                    <Button label="Submit claim" type="submit" icon="pi pi-plus"
                            iconPos="right"/>
                </div>
            </div>

            <ClaimForm claimFormData={ claimFormData } onFieldChange={ handleFormFieldChange }
                       errors={ claimErrors }/>
            <AddExpenseForm claimFormData={ claimFormData } onClaimItemsUpdate={ handleClaimItemsUpdate }
                            expenseFormData={ expenseFormData } onSetExpenseForm={ setExpenseFormData }
                            onExpenseChange={ handleExpenseFieldChange }

                            onAddExpense={ handleAddExpense } tags={ tags } onSetTags={ setTags } files={ files }
                            onSetFiles={ setFiles } errors={ expenseErrors }
                            toastRef={ toastRef }
            />
        </form>

    )
}

export default CreateClaim