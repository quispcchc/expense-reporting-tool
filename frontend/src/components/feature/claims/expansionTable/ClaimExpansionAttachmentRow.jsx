import React from 'react'
import Upload from '../uploadAttchment/Upload.jsx'
import AttachmentList from '../uploadAttchment/AttchmentList.jsx'

// Customized expanded row: attachment editing dropdown in datatable
function ClaimExpansionAttachmentRow ({ label, file, isEditing, rowData, handleInputChange, mode }) {

    // Handle new files selected by user (supports multiple files)
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (!selectedFiles || selectedFiles.length === 0) return;

        // Convert File objects to our format with URLs
        const fileObjects = selectedFiles.map(file => ({
            file: file,
            url: URL.createObjectURL(file),
            name: file.name,
            isNew: true  // Mark as new upload
        }));

        console.log('selected files:', fileObjects);

        // Get existing attachments (could be array or single object)
        const currentAttachments = Array.isArray(file) ? file : (file ? [file] : []);
        
        // Append new files to existing ones
        const updatedAttachments = [...currentAttachments, ...fileObjects];

        // Notify parent to update attachments for this row
        handleInputChange(rowData.transactionId, 'attachment', updatedAttachments);
    }

    // Remove a file by its index from the attachments list
    const handleRemoveFile = (indexToRemove) => {
        console.log('Removing file at index:', indexToRemove, 'for transaction ID:', rowData.transactionId);
        
        const currentAttachments = Array.isArray(file) ? file : (file ? [file] : []);
        const updatedAttachments = currentAttachments.filter((_, index) => index !== indexToRemove);
        
        // If no files left, set to null instead of empty array
        handleInputChange(rowData.transactionId, 'attachment', updatedAttachments.length > 0 ? updatedAttachments : null);
    }

    // Render the list of attachments or show message if none exist
    const renderAttachment = (file, showRemoveButton) => {
        const attachments = Array.isArray(file) ? file : (file ? [file] : []);
        
        if (attachments.length === 0) {
            return <p className="text-sm text-[#888888]">No attachments available.</p>
        }

        return (
            <div className="space-y-2">
                {attachments.map((attachment, index) => (
                    <AttachmentList 
                        key={index}
                        selectedFile={attachment} 
                        handleRemoveFile={() => handleRemoveFile(index)}
                        showRemoveButton={showRemoveButton}
                    />
                ))}
            </div>
        );
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