import React from 'react'
import Input from '../../common/ui/Input.jsx'
import { useTranslation } from 'react-i18next'

function MileageHeaderForm({ mileageHeader, onHeaderChange, errors = {} }) {
    const { t } = useTranslation()

    const handleChange = (e) => {
        const { name, value } = e.target
        onHeaderChange({ ...mileageHeader, [name]: value })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                name="period_of_from"
                label={t('mileage.periodFrom', 'Period From')}
                type="date"
                value={mileageHeader.period_of_from}
                onChange={handleChange}
                errors={errors}
            />
            <Input
                name="period_of_to"
                label={t('mileage.periodTo', 'Period To')}
                type="date"
                value={mileageHeader.period_of_to}
                onChange={handleChange}
                errors={errors}
            />
        </div>
    )
}

export default MileageHeaderForm
