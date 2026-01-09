import React from 'react'
import Upload from './Upload.jsx'
import AttachmentList from './AttchmentList.jsx'

function UploadAttachment ({ files, onSetFiles,errors }) {

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files).map(file => ( {
            file,
            url: URL.createObjectURL(file),
        } ))

        if (selectedFiles.length > 0) {
            onSetFiles(prev => ( [
                ...prev,
                ...selectedFiles,
            ] ))
        }
    }


    const handleRemoveFile = (filename) => {
        onSetFiles(prev =>
            prev.filter(file => file.file.name !== filename),
        )
    }

    return (
        <div>
            <h4 className="text-[22px]">Attachments</h4>
            <p className="my-2">Note:Upload Receipt,contact/agreement or additional supporting documents</p>
            <div className="flex justify-center items-center border border-gray-300 rounded-md p-5">
                <Upload handleFileSelect={ handleFileSelect }/>
            </div>
            <AttachmentList files={ files } handleRemoveFile={ handleRemoveFile }/>
            <p className='text-red-500 text-sm mt-2'>{ errors.attachment }</p>


        </div>
    )
}

export default UploadAttachment