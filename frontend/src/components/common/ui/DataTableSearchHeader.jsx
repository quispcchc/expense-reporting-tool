import React from 'react'
import { InputText } from 'primereact/inputtext'
import { IconField } from 'primereact/iconfield'
import { InputIcon } from 'primereact/inputicon'
import { useTranslation } from 'react-i18next'

function DataTableSearchHeader({ value, onChange }) {
    const { t } = useTranslation()
    return (
        <div className="flex justify-end">
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText value={value} onChange={onChange} placeholder={t('common.keywordSearch')} />
            </IconField>
        </div>
    )
}

export default DataTableSearchHeader
