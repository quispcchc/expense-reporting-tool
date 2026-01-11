import React from 'react'
import ClaimExpansionDropdownRow from './ClaimExpansionDropdownRow.jsx'
import ClaimExpansionInputRow from './ClaimExpansionInputRow.jsx'
import ClaimExpansionAttachmentRow from './ClaimExpansionAttachmentRow.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'

function ClaimRowExpansion({
    rowData,
    editingRowId,
    claimItems,
    expandedRowData,
    handleInputChange,
    mode,
}) {
    const { t } = useTranslation()
    const { lookups: { projects } } = useLookups()

    // Determine if the current row is in editing mode
    const isEditing = editingRowId === rowData.transactionId

    // Get the original claim item data for this row
    const currentData = claimItems.find(item => item.transactionId === rowData.transactionId) || rowData
    // console.log('claimItems',claimItems)
    // console.log('current data',currentData)

    // Get any changes made in the expanded row for this transactionId
    const expansionChanges = expandedRowData[rowData.transactionId] || {}

    // Merge original data with any expanded data changes
    // For attachment field: if expansion has changes, use ONLY those (not merged) to prevent duplication
    const displayData = {
        ...currentData,
        ...expansionChanges,
        // If expansionChanges explicitly set attachment, use that value only (could be new files only)
        // Otherwise fall back to currentData.attachment
        attachment: expansionChanges.hasOwnProperty('attachment')
            ? expansionChanges.attachment
            : currentData.attachment
    }

    // Convert tags array to comma-separated string or fallback to empty string
    const getTagsValue = (tags) => {

        if (!tags) return ''

        // String → return directly
        if (typeof tags === 'string') {
            return tags
        }

        // Array
        if (Array.isArray(tags)) {
            // Array of objects (edit/view)
            if (tags.length && typeof tags[0] === 'object') {
                return tags.map(tag => tag.tag_name).join(',');
            }

            // Array of strings (create)
            return tags.join(',');
        }
        return ''
    }


    return (
        <div
            key={`expansion-${displayData.transactionId}`}
            className="px-18"
        >
            <div className="grid grid-cols-1 gap-4">
                {/* Dropdown to select program/project */}
                <ClaimExpansionDropdownRow
                    label={t('expenses.program')}
                    field="program"
                    placeholder={t('expenses.selectProgram', 'Please select the program')}
                    options={projects.map(
                        opt => ({ label: `${opt.project_name} - ${opt.project_desc}`, value: opt.project_id }))}
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.program || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Input for tags as comma-separated string */}
                <ClaimExpansionInputRow
                    label={t('expenses.tags', 'Tags')}
                    field="tags"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={getTagsValue(displayData.tags)}
                    handleInputChange={handleInputChange}
                />

                {/* Input for expense description */}
                <ClaimExpansionInputRow
                    label={t('expenses.description')}
                    field="description"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.description || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Input for notes */}
                <ClaimExpansionInputRow
                    label={t('expenses.notes')}
                    field="notes"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.notes || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Attachment list and upload functionality */}
                <ClaimExpansionAttachmentRow
                    label={t('expenses.attachments')}
                    isEditing={isEditing}
                    file={displayData.attachment || null}
                    rowData={rowData}
                    handleInputChange={handleInputChange}
                    mode={mode}
                />
            </div>
        </div>
    )
}

export default ClaimRowExpansion