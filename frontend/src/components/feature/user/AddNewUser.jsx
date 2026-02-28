import React, { useState, useRef } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { useUserDispatch } from '../../../contexts/UserContext.jsx'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import { showToast } from '../../../utils/helpers.js'
import { MultiSelect } from 'primereact/multiselect'

function AddNewUser() {
    const { t } = useTranslation()
    const toastRef = useRef(null)
    const [errors, setErrors] = useState({})
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { lookups } = useLookups()
    const { createUser } = useUserDispatch()

    const [userFormData, setUserFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        department: '',
        teams: [],
        position: '',
        role: '',
    })

    const handleUserFormChange = (e) => {
        const { name, value } = e.target
        setUserFormData(prev => {
            if (name === 'department') {
                return {
                    ...prev,
                    department: value,
                    teams: [], // Clear teams when department changes
                }
            }
            return {
                ...prev,
                [name]: value,
            }
        })
    }

    // For MultiSelect teams
    const handleTeamsChange = (value) => {
        setUserFormData(prev => ({
            ...prev,
            teams: value,
        }))
    }

    // Filter teams based on selected department
    const filteredTeams = userFormData.department
        ? lookups.teams.filter(team => team.department_id === userFormData.department)
        : [];

    const resetForm = () => {
        setUserFormData({
            first_name: '',
            last_name: '',
            email: '',
            department: '',
            teams: [],
            position: '',
            role: '',
        })
        setErrors({})
    }

    const handleUserFormSubmit = (e) => {
        e.preventDefault()

        const schema = validationSchemas.addUser
        const validation = validateForm(userFormData, schema)

        if (!validation.isValid) {
            setErrors(validation.errors)
            return
        }

        setErrors({})
        setIsLoading(true);

        (async () => {
            const result = await createUser({
                first_name: userFormData.first_name,
                last_name: userFormData.last_name,
                email: userFormData.email,
                role_id: userFormData.role,
                department_id: userFormData.department || null,
                team_ids: userFormData.teams,
                position_name: userFormData.position || null,
            })

            if (result?.success) {
                showToast(toastRef, {
                    severity: 'success',
                    summary: t('common.success', 'Success'),
                    detail: t('users.userCreatedSuccess'),
                    life: 3000
                })
                resetForm()
                setIsOpen(false)
            } else {
                showToast(toastRef, {
                    severity: 'error',
                    summary: t('common.error', 'Error'),
                    detail: result?.error || t('users.userCreatedError'),
                    life: 4000
                })
            }
            setIsLoading(false)
        })()
    }


    return (
        <div className="bg-white rounded-xl p-6">
            <Toast ref={toastRef} />

            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">{t('users.addNewUser')}</h4>
                    <p className="text-xs text-gray-500">{t('users.addNewUserDescription')}</p>
                </div>

                <button
                    type="button"
                    className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl cursor-pointer hover:text-gray-900 transition`}
                    onClick={() => setIsOpen(prev => !prev)}
                    disabled={isLoading}
                />
            </div>

            {isOpen && (
                <form className="my-5" onSubmit={handleUserFormSubmit}>
                    {/* Row 1: Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <Input
                            name="first_name"
                            id="first_name"
                            label={t('users.firstName')}
                            value={userFormData.first_name}
                            onChange={handleUserFormChange}
                            placeholder={t('users.enterFirstName')}
                            errors={errors}
                            disabled={isLoading}
                            error={errors}
                        />
                        <Input
                            name="last_name"
                            id="last_name"
                            label={t('users.lastName')}
                            value={userFormData.last_name}
                            onChange={handleUserFormChange}
                            placeholder={t('users.enterLastName')}
                            errors={errors}
                            disabled={isLoading}
                            error={errors}
                        />
                        <Input
                            name="email"
                            id="email"
                            label={t('users.email')}
                            value={userFormData.email}
                            onChange={handleUserFormChange}
                            placeholder={t('users.enterEmail')}
                            errors={errors}
                            disabled={isLoading}
                            error={errors}
                        />
                    </div>

                    {/* Row 2: Organization Info */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <Select
                                id="department"
                                name="department"
                                label={t('users.department')}
                                value={userFormData.department}
                                onChange={handleUserFormChange}
                                placeholder={t('users.selectDepartment')}
                                className="w-full"
                                options={lookups.departments.map(option => ({
                                    value: option.department_id,
                                    label: option.department_name,
                                }))}
                                errors={errors}
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <label htmlFor="teams" className="block text-sm font-medium">
                                    {t('users.teams')}
                                </label>
                                 {errors['teams'] && <span className="text-status-danger text-xs">({t(errors['teams'])})</span>}
                            </div>

                            <MultiSelect
                                id="teams"
                                name="teams"
                                value={userFormData.teams}
                                onChange={e => handleTeamsChange(e.value)}
                                options={filteredTeams.map(option => ({
                                    value: option.team_id,
                                    label: option.team_name,
                                }))}
                                optionLabel="label"
                                optionValue="value"
                                display="chip"
                                placeholder={userFormData.department ? t('users.selectTeam') : t('users.selectDepartmentFirst')}
                                className="w-full"
                                disabled={isLoading || !userFormData.department}
                            />
                        </div>

                        <div>
                            <Input
                                name="position"
                                id="position"
                                label={t('users.position')}
                                value={userFormData.position}
                                onChange={handleUserFormChange}
                                placeholder={t('users.enterPosition')}
                                errors={errors}
                                disabled={isLoading}
                            />
                        </div>
                    </div>



                    {/* Row 3: Role and Actions */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                        <div>
                            <Select
                                name="role"
                                id="role"
                                label={t('users.role')}
                                value={userFormData.role}
                                className="w-full"
                                options={lookups.roles.map(r => ({ label: r.role_name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()), value: r.role_id }))}
                                onChange={handleUserFormChange}
                                placeholder={t('users.selectRole')}
                                errors={errors}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Empty spacer column */}
                        <div className="hidden sm:block"></div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2">
                            <Button
                                label={t('common.cancel')}
                                className="p-button-outlined !h-[48px]"
                                onClick={resetForm}
                                disabled={isLoading}
                                type="button"
                            />
                            <Button
                                label={t('common.save')}
                                className="!h-[48px] px-8"
                                type="submit"
                                loading={isLoading}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}

export default AddNewUser