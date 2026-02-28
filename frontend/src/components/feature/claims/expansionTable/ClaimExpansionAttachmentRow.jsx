import React from 'react'
import Upload from '../uploadAttchment/Upload.jsx'
import AttachmentList from '../uploadAttchment/AttachmentList.jsx'
import { useTranslation } from 'react-i18next'

// Customized expanded row: attachment editing dropdown in datatable
function ClaimExpansionAttachmentRow({ label, file, isEditing, rowData, handleInputChange, mode }) {
    const { t } = useTranslation()

    // Handle new files selected by user (supports multiple files)
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (!selectedFiles || selectedFiles.length === 0) return;

        // Convert File objects to our format with URLs
        const fileObjects = selectedFiles.map(f => ({
            file: f,
            url: URL.createObjectURL(f),
            name: f.name,
            isNew: true  // Mark as new upload
        }));

        // Get existing attachments - file prop now correctly represents current state
        // (either expansionChanges.attachment if modified, or original currentData.attachment)
        const currentAttachments = Array.isArray(file) ? file : (file ? [file] : []);

        // Append new files to existing ones
        const updatedAttachments = [...currentAttachments, ...fileObjects];

        // Notify parent to update attachments for this row
        handleInputChange(rowData.transactionId, 'attachment', updatedAttachments);
    }

    // Remove a file by its index from the attachments list
    const handleRemoveFile = (indexToRemove) => {
        const currentAttachments = Array.isArray(file) ? file : (file ? [file] : []);

        // For existing files (with receipt_id), mark them for deletion instead of removing
        const fileToRemove = currentAttachments[indexToRemove];
        let updatedAttachments;
        let deletedReceiptId = null;

        if (fileToRemove?.receipt_id) {
            // Existing file from backend - track the receipt_id for deletion
            deletedReceiptId = fileToRemove.receipt_id;
            updatedAttachments = currentAttachments.filter((_, index) => index !== indexToRemove);
        } else {
            // New file - just remove it
            updatedAttachments = currentAttachments.filter((_, index) => index !== indexToRemove);
        }

        // If no files left, set to empty array (not null, so FormData processes it)
        const finalAttachments = updatedAttachments.length > 0 ? updatedAttachments : []
        handleInputChange(rowData.transactionId, 'attachment', finalAttachments);

        // If a backend file was deleted, also track the deleted receipt ID
        if (deletedReceiptId) {
            // Let parent accumulate deleted IDs
            handleInputChange(rowData.transactionId, 'deletedReceiptIds', deletedReceiptId);
        }
    }

    // Render the list of attachments or show message if none exist
    const renderAttachment = (file, showRemoveButton) => {
        const attachments = Array.isArray(file) ? file : (file ? [file] : []);

        if (attachments.length === 0) {
            return <p className="text-sm text-text-secondary">{t('upload.noAttachments', 'No attachments available.')}</p>
        }

        return (
            <AttachmentList
                files={attachments}
                onRemoveFile={handleRemoveFile}
                showRemoveButton={showRemoveButton}
            />
        );
    }

    return (
        <div className="flex items-start gap-4">
            <label className="text-sm font-semibold text-gray-700 min-w-[150px] pt-2">
                {label}
            </label>
            <div className="flex-1">

                {isEditing ? (
                    <>
                        {/* Show upload button and allow removal if editing */}
                        <Upload handleFileSelect={handleFileSelect} />
                        {renderAttachment(file, true)}
                    </>
                ) : (
                    // Just show attachments without remove option if not editing
                    renderAttachment(file, false)
                )}
            </div>
        </div>
    )
}

export default ClaimExpansionAttachmentRow