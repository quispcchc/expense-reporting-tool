import React from 'react'
import { Checkbox } from 'primereact/checkbox'
import { useTranslation } from 'react-i18next'

function MileageToggle({ checked, onChange }) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <Checkbox
                inputId="mileageToggle"
                checked={checked}
                onChange={(e) => onChange(e.checked)}
            />
            <label htmlFor="mileageToggle" className="text-sm font-medium cursor-pointer">
                {t('mileage.includeMileage', 'Include Mileage')}
            </label>
        </div>
    )
}

export default MileageToggle
