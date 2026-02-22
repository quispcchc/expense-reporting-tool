import React from 'react'
import { Checkbox } from 'primereact/checkbox'
import { useTranslation } from 'react-i18next'

function MileageToggle({ checked, onChange }) {
    const { t } = useTranslation()

    return (
        <div
            className={`flex items-center gap-3 px-4 py-2 border rounded-xl cursor-pointer transition-colors select-none ${checked ? 'bg-blue-50/50 border-blue-200 text-brand-primary' : 'bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
            onClick={() => onChange(!checked)}
        >
            <Checkbox
                inputId="mileageToggle"
                checked={checked}
                onChange={(e) => { e.originalEvent?.stopPropagation(); onChange(e.checked); }}
                className={checked ? "p-checkbox-checked" : ""}
            />
            <label htmlFor="mileageToggle" className="text-sm font-medium cursor-pointer pointer-events-none">
                {t('mileage.includeMileage', 'Include Mileage')}
            </label>
        </div>
    )
}

export default MileageToggle
