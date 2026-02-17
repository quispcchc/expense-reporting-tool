import React from 'react'
import { InputSwitch } from 'primereact/inputswitch'
import { useTranslation } from 'react-i18next'

function MileageToggle({ checked, onChange }) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="mileageToggle" className="text-sm font-medium cursor-pointer">
                {t('mileage.includeMileage', 'Include Mileage')}
            </label>
            <InputSwitch
                inputId="mileageToggle"
                checked={checked}
                onChange={(e) => onChange(e.value)}
            />
        </div>
    )
}

export default MileageToggle
