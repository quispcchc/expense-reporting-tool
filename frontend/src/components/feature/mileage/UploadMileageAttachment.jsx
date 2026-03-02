import React from 'react'
import Upload from '../claims/uploadAttchment/Upload.jsx'
import AttachmentList from '../claims/uploadAttchment/AttachmentList.jsx'
import { useTranslation } from 'react-i18next'

function UploadMileageAttachment({ files, onSetFiles }) {
    const { t } = useTranslation()

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files)

        if (selectedFiles.length === 0) return

        const newFiles = selectedFiles.map(file => ({
            file,
            url: URL.createObjectURL(file),
        }))

        // Add new files to existing files array
        onSetFiles([...files, ...newFiles])
    }

    const handleRemoveFile = (indexToRemove) => {
        const fileToRemove = files[indexToRemove]
        if (fileToRemove?.url && fileToRemove.url.startsWith('blob:')) {
            URL.revokeObjectURL(fileToRemove.url)
        }
        onSetFiles(files.filter((_, index) => index !== indexToRemove))
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-2 mb-2">
                <label className='block text-sm font-medium'>{t('mileage.receipt', 'Receipt')}</label>
            </div>
            <Upload handleFileSelect={handleFileSelect} className="w-full" />
            <AttachmentList files={files} onRemoveFile={handleRemoveFile} />
        </div>
    )
}

export default UploadMileageAttachment