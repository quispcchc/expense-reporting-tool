import React from 'react'
import Upload from './Upload.jsx'
import AttachmentList from './AttchmentList.jsx'
import { useTranslation } from 'react-i18next'

function UploadAttachment({ files, onSetFiles, errors }) {
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
        <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium">{t('expenses.attachments')}</label>
                {errors.attachment && <span className="text-red-500 text-xs">({errors.attachment})</span>}
            </div>
            <p className="text-gray-500 text-xs mb-3">{t('upload.uploadDescription', 'Upload receipts, contracts, or any supporting documents.')}</p>
            <div className="flex justify-center items-center border border-gray-300 border-dashed rounded-md p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
                <Upload handleFileSelect={handleFileSelect} />
            </div>
            {/* Render each attached file */}
            {files && files.length > 0 && files.map((file, index) => (
                <AttachmentList
                    key={index}
                    selectedFile={file}
                    handleRemoveFile={() => handleRemoveFile(index)}
                />
            ))}
        </div>
    )
}

export default UploadAttachment