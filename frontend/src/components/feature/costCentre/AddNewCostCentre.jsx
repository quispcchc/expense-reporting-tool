import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { Button } from 'primereact/button'
import { useCostCentre } from '../../../contexts/CostCentreContext.jsx'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { ProgressSpinner } from 'primereact/progressspinner'
import { useTranslation } from 'react-i18next'

function AddNewCostCentre({ createdToast }) {
    const { t } = useTranslation()
    const { lookups } = useLookups()

    const {
        actions: { createCostCentre },
        state: { loading }
    } = useCostCentre()

    const [validationErrors, setValidationErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const initialData = {
        department: '',
        code: '',
        status: '',
        description: '',
    }
    const [costCentreFormData, setCostCentreFormData] = useState(initialData)

    const handleCostCentreFormChange = (e) => {
        const { name, value } = e.target
        setCostCentreFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleCostCentreFormSubmit = async (e) => {
        e.preventDefault()
        const schema = validationSchemas.addCostCentre
        const validation = validateForm(costCentreFormData, schema)

        if (validation.isValid) {
            const response = await createCostCentre(costCentreFormData)

            if (response?.success) {
                setCostCentreFormData(initialData)
                createdToast()
            }
        }
        setValidationErrors(validation.errors)

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
                    <h4 className="text-[22px]">{t('costCentre.addNewCostCentre', 'Add New Cost Centre')}</h4>
                    <p className="text-xs text-gray-500">{t('costCentre.addNewDescription', 'Fill in the details below to add a new cost centre to the system.')}</p>
                </div>

                <button className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                    onClick={() => setIsOpen(prev => !prev)}></button>
            </div>

            {isOpen && (
                <form className={`my-5 grid grid-cols-1 sm:grid-cols-12 gap-5 ${validationErrors.length > 0
                    ? 'items-center'
                    : 'items-end'}`}
                    onSubmit={handleCostCentreFormSubmit}>
                    <div className="col-span-4">
                        <Select name="department" id="department" label={t('users.department')}
                            options={lookups.departments.map(
                                option => ({ label: option.department_name, value: option.department_id }))}
                            value={costCentreFormData.department} onChange={handleCostCentreFormChange}
                            placeholder={t('costCentre.selectDepartment', 'Select a department')} errors={validationErrors} />
                    </div>

                    <div className="col-span-3">
                        <Input name="code" id="code" label={t('teams.code')} value={costCentreFormData.code}
                            onChange={handleCostCentreFormChange} placeholder={t('costCentre.enterCode', 'Enter code')}
                            errors={validationErrors} />
                    </div>

                    <div className="col-span-3">
                        <Input name="description" id="description" label={t('costCentre.description', 'Description')}
                            value={costCentreFormData.description}
                            onChange={handleCostCentreFormChange} placeholder={t('costCentre.enterDescription', 'Enter description')}
                            errors={validationErrors} />
                    </div>

                    <div className="col-span-2">
                        <Button label={t('common.addNew')} className="!h-[48px]" />
                    </div>

                </form>)}


        </div>

    )
}

export default AddNewCostCentre