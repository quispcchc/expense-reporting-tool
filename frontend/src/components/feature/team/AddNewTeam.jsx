import React, { useState } from 'react'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { Button } from 'primereact/button'
import { useTeamDispatch } from '../../../contexts/TeamContext.jsx'
import { generateId } from '../../../utils/helpers.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'
import { validateForm } from '../../../utils/validation/validator.js'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'

function AddNewTeam() {
    const { t } = useTranslation()
    const [errors, setErrors] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const dispatch = useTeamDispatch()
    const { lookups, refreshLookups } = useLookups()
    const statusOptions = lookups.activeStatuses.map(s => s.name || s)
    const [teamFormData, setTeamFormData] = useState({
        code: '',
        name: '',
        status: '',
    })

    const handleTeamFormChange = (e) => {
        const { name, value } = e.target
        setTeamFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleTeamFormSubmit = (e) => {
        e.preventDefault()
        const schema = validationSchemas.addTeam
        const validation = validateForm(teamFormData, schema)
        console.log(validation)

        if (validation.isValid) {
            console.log(teamFormData)
            dispatch({ type: 'create', payload: teamFormData })
            refreshLookups()
        }

        setErrors(validation.errors)

    }
    return (
        <div className="bg-white rounded-xl p-6">
            <div className="flex justify-between items-center text-gray-700">
                <div>
                    <h4 className="text-[22px]">{t('teams.addNewTeam')}</h4>
                    <p className="text-xs text-gray-500">{t('teams.addNewTeamDescription')}</p>
                </div>

                <button className={`pi ${isOpen ? 'pi-chevron-up' : 'pi-chevron-down'} !text-xl`}
                    onClick={() => setIsOpen(prev => !prev)}></button>

            </div>
            {isOpen && (
                <form className={`my-5 grid grid-cols-1 sm:grid-cols-7 ${errors.length === 0 ? "items-end" : "items-center"} gap-5`}
                    onSubmit={handleTeamFormSubmit}>
                    <div className="col-span-2">
                        <Input name="code" id="code" label={t('teams.code')} value={teamFormData.code}
                            onChange={handleTeamFormChange} placeholder={t('teams.enterCode', 'Enter code')}
                            errors={errors} />
                    </div>
                    <div className="col-span-2">
                        <Input name="name" id="name" label={t('teams.name')} value={teamFormData.last_name}
                            onChange={handleTeamFormChange} placeholder={t('teams.enterName', 'Enter name')}
                            errors={errors} />
                    </div>
                    <div className="col-span-2">
                        <Select name="status" id="status" label={t('common.status')} options={statusOptions}
                            value={teamFormData.status} onChange={handleTeamFormChange}
                            placeholder={t('teams.selectStatus', 'Select status')} errors={errors} />
                    </div>
                    <Button label={t('common.addNew')} className="!h-[48px]" />


                </form>)}


        </div>
    )
}

export default AddNewTeam