import React from 'react'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import Input from '../../common/ui/Input.jsx'
import Select from '../../common/ui/Select.jsx'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import MileageToggle from '../mileage/MileageToggle.jsx'

function ClaimForm({ claimFormData, onFieldChange, errors, includeMileage, onMileageToggle }) {
    const { t } = useTranslation()
    const { lookups: { departments, claimTypes, positions, teams } } = useLookups()

    return (
        // Main container with title and description
        <ComponentContainer
            title={t('claimForm.title', 'Expense Claim Form')}
            headerRight={onMileageToggle && <MileageToggle checked={includeMileage} onChange={onMileageToggle} />}
        >
            <p className="text-gray-400 text-sm mb-5">{t('claimForm.description', 'Please complete all required fields to submit your expense claim.')}</p>

            {/* Two autofilled input fields side by side: Employee Name (disabled) and Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Employee Name input - disabled to prevent editing */}
                <Input label={t('claimForm.employeeName', 'Employee Name')} name="employeeName" id="employeeName" disabled
                    value={claimFormData.employeeName} onChange={onFieldChange} errors={errors} />

                {/* Position input - editable */}
                <Select name="position" id="position" label={t('users.position')} value={claimFormData.position}
                    options={positions.map(opt => ({ label: opt.position_name, value: opt.position_id }))}
                    onChange={onFieldChange} errors={errors} />
            </div>

            {/* Dropdown selects for Claim Type, Department, Team */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <Select name="claimType" id="claimType" label={t('claims.claimType')} value={claimFormData.claimType || ''}
                    options={claimTypes.map(opt => ({ label: opt.claim_type_name, value: opt.claim_type_id }))}
                    onChange={onFieldChange} placeholder={t('claimForm.selectClaimType', 'Select a Claim Type')}
                    errors={errors} />

                <Select name="department" id="department" label={t('users.department')} value={claimFormData.department}
                    onChange={onFieldChange}
                    options={departments.filter(dept => dept.active_status_id === 1).map(opt => ({ label: opt.department_name, value: opt.department_id }))}
                    placeholder={t('claimForm.selectDepartment', 'Select a Department')}
                    errors={errors} />

                <Select name="team" id="team" label={t('users.team')} value={claimFormData.team}
                    onChange={onFieldChange}
                    options={teams.filter(team => team.department_id === claimFormData.department && team.active_status_id === 1).map(opt => ({ label: opt.team_name, value: opt.team_id }))}
                    placeholder={t('claimForm.selectTeam', 'Select a Team')}
                    errors={errors} />
            </div>

            {/* Textarea input for additional notes */}
            <div>
                <label className="block text-sm font-medium mb-2">{t('expenses.notes')}</label>
                <textarea
                    name="note"
                    rows="3"
                    onChange={onFieldChange}
                    value={claimFormData.note}
                    placeholder={t('claimForm.notesPlaceholder', 'Enter additional notes or comments...')}
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

        </ComponentContainer>
    )
}

export default ClaimForm