import React from 'react'
import { Checkbox } from 'primereact/checkbox'
import { useTranslation } from 'react-i18next'
import { InputSwitch } from 'primereact/inputswitch'
import { FaCar } from 'react-icons/fa'

function MileageToggle({ checked, onChange }) {
    const { t } = useTranslation()

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="mileageToggle" className="text-sm font-medium cursor-pointer">
                <span className="hidden sm:inline">{t('mileage.includeMileage', 'Include Mileage')}</span>
                <FaCar className="inline sm:hidden" title="Mileage" />
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
