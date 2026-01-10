import React from 'react'
import Upload from './Upload.jsx'
import AttachmentList from './AttchmentList.jsx'

function UploadAttachment ({ files, onSetFiles,errors }) {

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
        <div>
            <h4 className="text-[22px]">Attachments</h4>
            <p className="my-2">Note:Upload Receipt,contact/agreement or additional supporting documents</p>
            <div className="flex justify-center items-center border border-gray-300 rounded-md p-5">
                <Upload handleFileSelect={ handleFileSelect }/>
            </div>
            {/* Render each attached file */}
            {files && files.length > 0 && files.map((file, index) => (
                <AttachmentList 
                    key={index} 
                    selectedFile={file} 
                    handleRemoveFile={() => handleRemoveFile(index)}
                />
            ))}
            <p className='text-red-500 text-sm mt-2'>{ errors.attachment }</p>
        </div>
    )
}

export default UploadAttachment