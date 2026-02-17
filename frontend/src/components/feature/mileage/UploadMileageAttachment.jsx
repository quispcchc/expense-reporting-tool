import React from 'react'
import Upload from '../claims/uploadAttchment/Upload.jsx'
import AttachmentList from '../claims/uploadAttchment/AttchmentList.jsx'
import { useTranslation } from 'react-i18next'

function UploadMileageAttachment({ files, onSetFiles, errors }) {
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
            <div className='flex flex-col justify-between p-1'>
                <label className='block text-sm font-medium'>Receipt</label>
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

export default UploadMileageAttachment