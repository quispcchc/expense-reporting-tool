import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import { Button } from 'primereact/button'
import { useAccountNumber } from '../../../contexts/AccountNumberContext.jsx'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useTranslation } from 'react-i18next'

function AddNewAccountNumber({ createdToast }) {
    const { t } = useTranslation()

    const {
        actions: { createAccountNumber },
        state: { loading }
    } = useAccountNumber()

    const [validationErrors, setValidationErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const initialData = {
        accountNumber: '',
        description: '',
    }
    const [accountNumberFormData, setAccountNumberFormData] = useState(initialData)

    const handleAccountNumberFormChange = (e) => {
        const { name, value } = e.target
        setAccountNumberFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleAccountNumberFormSubmit = async (e) => {
        e.preventDefault()
        const schema = validationSchemas.addAccountNumber
        const validation = validateForm(accountNumberFormData, schema)

        if (validation.isValid) {
            const response = await createAccountNumber(accountNumberFormData)

            if (response?.status === 201) {
                setAccountNumberFormData(initialData)
                setValidationErrors([])
                createdToast()
            } else if (response?.error) {
                setValidationErrors([{ field: '', message: response.error }])
            }
        } else {
            setValidationErrors(validation.errors)
        }
    }

    return (
        <div className="bg-white rounded-xl p-6">
            {loading && (
                <div className="absolute inset-0 flex justify-center items-center z-10">
                    <ProgressSpinner />
                </div>
            )}

            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">{t('accountNumbers.addNewAccountNumber', 'Add New Account Number')}</h4>
                    <p className="text-xs text-gray-500">{t('accountNumbers.addNewDescription', 'Fill in the details below to add a new account number to the system.')}</p>
                </div>

                <button className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                    onClick={() => setIsOpen(prev => !prev)}></button>
            </div>

            {isOpen && (
                <form className={`my-5 grid grid-cols-1 sm:grid-cols-12 gap-5 ${validationErrors.length > 0
                    ? 'items-center'
                    : 'items-end'}`}
                    onSubmit={handleAccountNumberFormSubmit}>
                    <div className="col-span-4">
                        <Input name="accountNumber" id="accountNumber" label={t('accountNumbers.accountNumber', 'Account Number')}
                            value={accountNumberFormData.accountNumber}
                            onChange={handleAccountNumberFormChange} placeholder={t('accountNumbers.enterAccountNumber', 'Enter account number')}
                            type="number"
                            errors={validationErrors} />
                    </div>

                    <div className="col-span-6">
                        <Input name="description" id="description" label={t('accountNumbers.description', 'Description')}
                            value={accountNumberFormData.description}
                            onChange={handleAccountNumberFormChange} placeholder={t('accountNumbers.enterDescription', 'Enter description')}
                            errors={validationErrors} />
                    </div>

                    <div className="col-span-2">
                        <Button label={t('common.addNew')} className="!h-[48px]" disabled={loading} />
                    </div>

                </form>)}
        </div>
    )
}

export default AddNewAccountNumber
