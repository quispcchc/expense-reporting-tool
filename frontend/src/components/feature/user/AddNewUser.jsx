import React, { useEffect, useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { Button } from 'primereact/button'
import { useUserDispatch } from '../../../contexts/UserContext.jsx'
import { generateId } from '../../../utils/helpers.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { MultiSelect } from 'primereact/multiselect'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { Dropdown } from 'primereact/dropdown'
import { useTranslation } from 'react-i18next'

function AddNewUser() {
    const { t } = useTranslation()
    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)

    const { lookups } = useLookups()

    // const [selectedTeams, setSelectedTeams] = useState(null)
    // const [selectedRoles, setSelectedRoles] = useState(null)
    const { createUser } = useUserDispatch()

    const [userFormData, setUserFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        department: '',
        team: '',
        position: '',
        role: '',

    })

    useEffect(() => {
        console.log(userFormData)
    }, [userFormData])

    const handleUserFormChange = (e) => {
        const { name, value } = e.target
        setUserFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleUserFormSubmit = (e) => {
        e.preventDefault()

        // const updatedUser = { ...userFormData, teams: selectedTeams, roles: selectedRoles, user_id: generateId() }

        const schema = validationSchemas.addUser
        // const validation = validateForm(updatedUser, schema)
        const validation = validateForm(userFormData, schema)

        console.log(validation)

        // console.log(updatedUser)

        if (validation.isValid) {
            ; (async () => {
                try {
                    await createUser({
                        first_name: userFormData.first_name,
                        last_name: userFormData.last_name,
                        email: userFormData.email || '',
                        role_id: userFormData.role,
                        team_id: userFormData.team
                    })
                    // Optionally clear form on success
                    setUserFormData({})
                    // setSelectedRoles(null)
                    // setSelectedTeams(null)
                }
                catch (err) {
                    console.error('Failed to create user', err)
                    setErrors(prev => ({ ...prev, form: err.message }))
                }
            })()
        }

        console.log(selectedTeams, selectedRoles)
        setErrors(validation.errors)

    }
    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">{t('users.addNewUser')}</h4>
                    <p className="text-xs text-gray-500">{t('users.addNewUserDescription')}</p>
                </div>

                <button className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                    onClick={() => setIsOpen(prev => !prev)}></button>

            </div>
            {isOpen && (
                <form className="my-5" onSubmit={handleUserFormSubmit}>
                    {/* Row 1: Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <Input name="first_name" id="first_name" label={t('users.firstName')} value={userFormData.first_name}
                            onChange={handleUserFormChange} placeholder={t('users.enterFirstName', 'Enter first name')}
                            errors={errors} />
                        <Input name="last_name" id="last_name" label={t('users.lastName')} value={userFormData.last_name}
                            onChange={handleUserFormChange} placeholder={t('users.enterLastName', 'Enter last name')}
                            errors={errors} />
                        <Input name="email" id="email" label={t('users.email')} value={userFormData.email}
                            onChange={handleUserFormChange} placeholder={t('users.enterEmail', 'Enter email address')}
                            errors={errors} />
                    </div>

                    {/* Row 2: Organization Info */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                            <Select id="department" name="department" label={t('users.department')} value={userFormData.department}
                                onChange={handleUserFormChange}
                                placeholder={t('users.selectDepartment', 'Select department')} className="w-full"
                                options={lookups.departments.map(option => ({
                                    value: option.department_id,
                                    label: option.department_name,
                                }))}
                                errors={errors}
                            />
                        </div>

                        <div>
                            <Select id="team" name="team" label={t('users.team')} value={userFormData.team}
                                onChange={handleUserFormChange}
                                placeholder={t('users.selectTeam', 'Select team')} className="w-full"
                                options={lookups.teams.map(option => ({
                                    value: option.team_id,
                                    label: option.team_name,
                                }))}
                                errors={errors}
                            />
                        </div>

                        <div>
                            <Input name="position" id="position" label={t('users.position')} value={userFormData.position}
                                onChange={handleUserFormChange} placeholder={t('users.enterPosition', 'Enter position')}
                                errors={errors} />
                        </div>
                    </div>

                    {/* Row 3: Role and Submit */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
                        <div>
                            <Select name="role" id="role" label={t('users.role')} value={userFormData.role} className="w-full"
                                options={lookups.roles.map(option => ({ label: option.role_name, value: option.role_id }))}
                                onChange={handleUserFormChange}
                                placeholder={t('users.selectRole', 'Select role')} errors={errors} />
                        </div>

                        {/* Empty spacer column */}
                        <div className="hidden sm:block"></div>

                        {/* Save button aligned to bottom-right */}
                        <div className="flex justify-end">
                            <Button label={t('common.save')} className="!h-[48px] w-full sm:w-auto px-8" />
                        </div>
                    </div>

                </form>
            )}


        </div>
    )
}

export default AddNewUser