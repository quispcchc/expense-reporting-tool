import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { Button } from 'primereact/button'
import { useDepartment } from '../../../contexts/DepartmentContext.jsx'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'

function AddNewDepartment({ toastRef }) {
    const { t } = useTranslation()
    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { actions } = useDepartment()
    const { lookups, refreshLookups } = useLookups()

    const statusOptions = lookups.activeStatuses.map(s => ({
        label: s.active_status_name,
        value: s.active_status_id
    }))

    const [formData, setFormData] = useState({
        department_abbreviation: '',
        department_name: '',
        active_status_id: '',
    })

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()

        // Simple validation
        const newErrors = []
        if (!formData.department_abbreviation) {
            newErrors.push({ field: 'department_abbreviation', message: t('validation.codeRequired') })
        }
        if (!formData.department_name) {
            newErrors.push({ field: 'department_name', message: t('validation.nameRequired') })
        }
        if (!formData.active_status_id) {
            newErrors.push({ field: 'active_status_id', message: t('validation.statusRequired') })
        }

        if (newErrors.length > 0) {
            setErrors(newErrors)
            return
        }

        setIsSubmitting(true)
        try {
            const result = await actions.createDepartment(formData)
            if (result?.success) {
                // Reset form
                setFormData({
                    department_abbreviation: '',
                    department_name: '',
                    active_status_id: '',
                })
                setErrors([])
                setIsOpen(false)
                // Show success toast
                toastRef?.current?.show({
                    severity: 'success',
                    summary: t('common.success'),
                    detail: t('departments.createSuccess', 'Department created successfully'),
                    life: 3000
                })
                // Refresh lookups so other pages (like Create Claim) get updated data
                await refreshLookups()
            } else {
                const errorMsg = result?.error || t('common.unknownError', 'An unknown error occurred')
                setErrors([{ field: '', message: errorMsg }])
                // Show error toast
                toastRef?.current?.show({
                    severity: 'error',
                    summary: t('common.error'),
                    detail: errorMsg,
                    life: 5000
                })
            }
        } catch (err) {
            const errorMsg = err?.message || t('common.networkError', 'Network error occurred')
            setErrors([{ field: '', message: errorMsg }])
            // Show error toast for network errors
            toastRef?.current?.show({
                severity: 'error',
                summary: t('common.error'),
                detail: errorMsg,
                life: 5000
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">{t('departments.addNewDepartment')}</h4>
                    <p className="text-xs text-gray-500">{t('departments.addNewDepartmentDescription')}</p>
                </div>

                <button className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                    onClick={() => setIsOpen(prev => !prev)}></button>
            </div>

            {isOpen && (
                <form className={`my-5 grid grid-cols-1 sm:grid-cols-7 ${errors.length === 0 ? "items-end" : "items-center"} gap-5`}
                    onSubmit={handleFormSubmit}>
                    <div className="col-span-2">
                        <Input
                            name="department_abbreviation"
                            id="department_abbreviation"
                            label={t('departments.code')}
                            value={formData.department_abbreviation}
                            onChange={handleFormChange}
                            placeholder={t('costCentre.enterCode')}
                            errors={errors}
                        />
                    </div>
                    <div className="col-span-2">
                        <Input
                            name="department_name"
                            id="department_name"
                            label={t('departments.name')}
                            value={formData.department_name}
                            onChange={handleFormChange}
                            placeholder={t('departments.enterName', 'Enter name')}
                            errors={errors}
                        />
                    </div>
                    <div className="col-span-2">
                        <Select
                            name="active_status_id"
                            id="active_status_id"
                            label={t('common.status')}
                            options={statusOptions}
                            value={formData.active_status_id}
                            onChange={handleFormChange}
                            placeholder={t('filter.selectOne')}
                            errors={errors}
                        />
                    </div>
                    <Button
                        label={t('common.addNew')}
                        className="!h-[48px]"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    />
                </form>
            )}
        </div>
    )
}

export default AddNewDepartment

