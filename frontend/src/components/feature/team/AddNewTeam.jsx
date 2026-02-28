import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { Button } from 'primereact/button'
import { useTeam } from '../../../contexts/TeamContext.jsx'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'

function AddNewTeam({ toastRef, departmentId, onCreated }) {
    const { t } = useTranslation()
    const [errors, setErrors] = useState({})
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { actions: { createTeam } } = useTeam()
    const { lookups, refreshLookups } = useLookups()

    const statusOptions = lookups.activeStatuses.map(s => ({
        label: s.active_status_name,
        value: s.active_status_id,
    }))

    const [formData, setFormData] = useState({
        team_abbreviation: '',
        team_name: '',
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

        const validation = validateForm(formData, validationSchemas.addTeam)
        if (!validation.isValid) {
            setErrors(validation.errors)
            return
        }

        setErrors({})
        setIsSubmitting(true)
        try {
            const payload = { ...formData }
            if (departmentId) {
                payload.department_id = parseInt(departmentId)
            }

            const result = await createTeam(payload)
            if (result.success) {
                setFormData({ team_abbreviation: '', team_name: '', active_status_id: '' })
                setErrors({})
                setIsOpen(false)
                toastRef?.current?.show({ severity: 'success', summary: t('common.success'), detail: t('teams.createSuccess', 'Team added successfully'), life: 3000 })
                await refreshLookups()
                onCreated?.()
            } else {
                toastRef?.current?.show({ severity: 'error', summary: t('common.error'), detail: result.error || t('teams.createError', 'Failed to add team'), life: 5000 })
            }
        } catch (err) {
            toastRef?.current?.show({ severity: 'error', summary: t('common.error'), detail: err?.message || t('teams.createError', 'Failed to add team'), life: 5000 })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-white rounded-xl p-4 md:p-6">
            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-lg md:text-[22px]">{t('teams.addNewTeam')}</h4>
                    <p className="text-xs text-gray-500">{t('teams.addNewTeamDescription')}</p>
                </div>

                <button className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                    onClick={() => setIsOpen(prev => !prev)}></button>
            </div>

            {isOpen && (
                <form className={`my-5 grid grid-cols-1 sm:grid-cols-7 items-end gap-3 md:gap-5`}
                    onSubmit={handleFormSubmit}>
                    <div className="col-span-2">
                        <Input
                            name="team_abbreviation"
                            id="team_abbreviation"
                            label={t('teams.code')}
                            value={formData.team_abbreviation}
                            onChange={handleFormChange}
                            placeholder={t('teams.enterCode', 'Enter code')}
                            errors={errors}
                        />
                    </div>
                    <div className="col-span-2">
                        <Input
                            name="team_name"
                            id="team_name"
                            label={t('teams.name')}
                            value={formData.team_name}
                            onChange={handleFormChange}
                            placeholder={t('teams.enterName', 'Enter name')}
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

export default AddNewTeam
