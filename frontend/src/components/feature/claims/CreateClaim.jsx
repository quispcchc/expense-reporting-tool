import AddExpenseForm from './AddExpenseForm.jsx'
import { useEffect, useState } from 'react'
import ContentHeader from '../../common/layout/ContentHeader.jsx'
import { Button } from 'primereact/button'
import ClaimForm from './ClaimForm.jsx'
import { validateForm } from '../../../utils/validation/validator.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { generateId } from '../../../utils/helpers.js'
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

function CreateClaim ({navigateTo,homePath}) {
    const { authUser } = useAuth()
    const { createClaim } = useClaims()
    const navigate = useNavigate()

    const [tags, setTags] = useState(['Client Travelling'])
    const [files, setFiles] = useState([])

    const [expenseErrors, setExpenseErrors] = useState([])
    const [claimErrors, setClaimErrors] = useState()

    const initialClaimFormData = {
        employeeName: authUser.full_name,
        position: authUser.position_name,
        claimType: '',
        note: '',
        team:authUser.department_name,
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
        notes:''
    }

    const [expenseFormData, setExpenseFormData] = useState(initialExpenseFormData)

    useEffect(() => {
        console.log(claimFormData)
        console.log(expenseFormData)
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
            [ name ]:value,
        } ))
    }

    const handleClaimItemsUpdate = (updatedClaimItems) => {
        setClaimFormData(prev => ({
            ...prev,
            claimItems: updatedClaimItems
        }))
    }

    const handleAddExpense = () => {
        const expenseSchema = validationSchemas.expense
        const validation = validateForm(expenseFormData, expenseSchema)
        setExpenseErrors(validation.errors)

        const completeExpenseData = {
            ...expenseFormData,
            tags: [...tags],
            attachments: [...files],
            transactionId:generateId(),
            status:'Pending'
        }

        if (validation.isValid) {
            setClaimFormData(prev => ( {
                ...prev,
                claimItems: [...prev.claimItems, completeExpenseData],
            } ))
        }
    }

    const handleFormSubmit = (e) => {
        e.preventDefault()
        const claimSchema = validationSchemas.claim
        const validation = validateForm(claimFormData, claimSchema)
        setClaimErrors(validation.errors)

        if (claimFormData.claimItems.length <= 0) return alert('please add at least one expense!')

        if (!validation.isValid) return

        createClaim({
            ...claimFormData,
            totalAmount: calculateTotalAmount(claimFormData),
            notes: claimFormData.note === '' ? [] : [
                {
                    submittedBy: authUser.full_name || 'Current User',
                    date: new Date().toISOString().split('T')[ 0 ],
                    description: claimFormData.note,
                },
            ] ,
        })

        setClaimFormData(initialClaimFormData)
        setExpenseFormData(initialExpenseFormData)
        setTags([])
        setFiles([])
        navigate(navigateTo)

    }

    return (
        <form className="my-3" onSubmit={ handleFormSubmit }>
            <div className="flex justify-between items-center flex-wrap">
                <ContentHeader title="Create a new claim" homePath={homePath}/>
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
            <AddExpenseForm claimFormData={ claimFormData } onClaimItemsUpdate={handleClaimItemsUpdate}
                            expenseFormData={ expenseFormData } onSetExpenseForm={setExpenseFormData}
                            onExpenseChange={ handleExpenseFieldChange }

                            onAddExpense={ handleAddExpense } tags={ tags } onSetTags={ setTags } files={ files }
                            onSetFiles={ setFiles } errors={ expenseErrors }/>
        </form>

    )
}

export default CreateClaim