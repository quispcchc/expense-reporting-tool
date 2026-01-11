import React from 'react'
import { useTranslation } from 'react-i18next'

// A reusable Upload button component that allows users to select and upload multiple files
function Upload({ handleFileSelect }) {
    const { t } = useTranslation()
    return (
        // Custom-styled label that acts as a button for file upload
        <label
            className="p-button p-component p-button-outlined p-2 cursor-pointer flex items-center gap-2">
            {t('components.upload')}
            <input
                name='attachment'
                id='attachment'
                type="file"
                multiple
                accept='image/*,application/pdf'
                onChange={handleFileSelect}
                className="hidden"
            />
            <i className="pi pi-cloud-upload"></i>
        </label>
    )
}

export default Upload