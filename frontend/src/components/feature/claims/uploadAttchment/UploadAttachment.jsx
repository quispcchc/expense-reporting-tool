import React from 'react'
import Upload from './Upload.jsx'
import AttachmentList from './AttchmentList.jsx'

function UploadAttachment ({ files, onSetFiles,errors }) {

    const handleFileSelect = (e) => {
        const file = e.target.files[ 0 ]

        const fileUrl = URL.createObjectURL(file);
        const selectedFile = {
            file,
            url: fileUrl,
        };
        onSetFiles(selectedFile)

    }

    const handleRemoveFile = () => {
        if (files?.url) URL.revokeObjectURL(files.url);
        onSetFiles({})
    }

    return (
        <div>
            <h4 className="text-[22px]">Attachments</h4>
            <p className="my-2">Note:Upload Receipt,contact/agreement or additional supporting documents</p>
            <div className="flex justify-center items-center border border-gray-300 rounded-md p-5">
                <Upload handleFileSelect={ handleFileSelect }/>
            </div>
            <AttachmentList selectedFile={ files } handleRemoveFile={ handleRemoveFile }/>
            <p className='text-red-500 text-sm mt-2'>{ errors.attachment }</p>


        </div>
    )
}

export default UploadAttachment