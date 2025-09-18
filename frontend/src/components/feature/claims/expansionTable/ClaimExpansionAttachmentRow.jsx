import React from 'react'
import Upload from '../uploadAttchment/Upload.jsx'
import AttachmentList from '../uploadAttchment/AttchmentList.jsx'

// Customized expanded row: attachment editing dropdown in datatable
function ClaimExpansionAttachmentRow ({ label, files, isEditing, rowData, handleInputChange }) {

    // Handle new files selected by user
    const handleFileSelect = (e) => {

        // Convert FileList to array and create preview URLs
        const selectedFiles = Array.from(e.target.files).map(file => ( {
            file,
            url: URL.createObjectURL(file),
        } ))

        if (selectedFiles.length > 0) {
            // Merge newly selected files with existing ones
            const currentFiles = files || []
            const newFiles = [...currentFiles, ...selectedFiles]

            // Notify parent(claimFormData in create claim page) to update attachments for this row
            handleInputChange(rowData.transactionId, 'attachments', newFiles)
        }
    }

    // Remove a file by its filename from the attachments list
    const handleRemoveFile = (filename) => {
        const currentFiles = files || []

        // Filter out the file to be removed
        const updatedFiles = currentFiles.filter(file =>
            ( file.file ? file.file.name : file.name ) !== filename,
        )

        // Notify parent(claimFormData in create claim page) to update attachments for this row
        handleInputChange(rowData.transactionId, 'attachments', updatedFiles)
    }

    // Render the list of attachments or show message if none exist
    const renderAttachmentList = (files, showRemoveButton) => {

        if (!files || files.length === 0) {
            return <p className="text-sm text-[#888888]">No attachments available.</p>
        }

        return <AttachmentList files={ files } handleRemoveFile={ handleRemoveFile }
                               showRemoveButton={ showRemoveButton }/>
    }

    return (
        <div className="flex items-start gap-4">
            <label className="text-sm font-semibold text-gray-700 min-w-[150px] pt-2">
                { label }
            </label>
            <div className="flex-1">
                { isEditing ? (
                    <>
                        {/* Show upload button and allow removal if editing */}
                        <Upload handleFileSelect={ handleFileSelect }/>
                        { renderAttachmentList(files, true) }
                    </>
                ) : (

                    // Just show attachments without remove option if not editing
                    renderAttachmentList(files, false)
                ) }
            </div>
        </div>
    )
}

export default ClaimExpansionAttachmentRow