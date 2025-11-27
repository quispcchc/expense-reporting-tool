import React from 'react'
import Upload from '../uploadAttchment/Upload.jsx'
import AttachmentList from '../uploadAttchment/AttchmentList.jsx'

// Customized expanded row: attachment editing dropdown in datatable
function ClaimExpansionAttachmentRow ({ label, file, isEditing, rowData, handleInputChange }) {

    // Handle new files selected by user
    const handleFileSelect = (e) => {
        const currenFile = e.target.files[ 0 ]

        if (!currenFile) return;

        const fileUrl = URL.createObjectURL(currenFile);
        const selectedFile = {
            file:currenFile,
            url: fileUrl,
        };

        console.log('selected',selectedFile)

        if (selectedFile) {
            // Notify parent(claimFormData in create claim page) to update attachments for this row
            handleInputChange(rowData.transactionId, 'attachment', selectedFile)
        }
    }

    // Remove a file by its filename from the attachments list
    const handleRemoveFile = () => {
        handleInputChange(rowData.transactionId, 'attachment', null)
    }

    // Render the list of attachments or show message if none exist
    const renderAttachment = (file, showRemoveButton) => {
        if (!file) {
            return <p className="text-sm text-[#888888]">No attachments available.</p>
        }

        return <AttachmentList selectedFile={ file } handleRemoveFile={ handleRemoveFile }
                               showRemoveButton={ showRemoveButton }/>
    }

    return (
        <div className="flex items-start gap-4">
            <label className="text-sm font-semibold text-gray-700 min-w-[150px] pt-2">
                { label }
            </label>
            <div className="flex-1">

                {isEditing ? (
                    <>
                        {/* Show upload button and allow removal if editing */ }
                        <Upload handleFileSelect={ handleFileSelect }/>
                        { renderAttachment(file, true) }
                    </>
                ) : (
                    // Just show attachments without remove option if not editing
                    renderAttachment(file, false)
                ) }
            </div>
        </div>
    )
}

export default ClaimExpansionAttachmentRow