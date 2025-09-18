import React from 'react'
import ClaimExpansionDropdownRow from './ClaimExpansionDropdownRow.jsx'
import ClaimExpansionInputRow from './ClaimExpansionInputRow.jsx'
import ClaimExpansionAttachmentRow from './ClaimExpansionAttachmentRow.jsx'
import { teams, programs } from '../../../../utils/mockData.js'

function ClaimRowExpansion({
    rowData,
    editingRowId,
    claimItems,
    expandedRowData,
    handleInputChange
}) {

    // Determine if the current row is in editing mode
    const isEditing = editingRowId === rowData.transactionId

    // Get the original claim item data for this row
    const currentData = claimItems.find(item => item.transactionId === rowData.transactionId) || rowData

    // Get any changes made in the expanded row for this transactionId
    const expansionChanges = expandedRowData[rowData.transactionId] || {}

    // Merge original data with any expanded data changes
    const displayData = { ...currentData, ...expansionChanges }

    // Convert tags array to comma-separated string or fallback to empty string
    const getTagsValue = (tags) => {
        if (!tags) return ''
        if (Array.isArray(tags)) return tags.join(',')
        return String(tags)
    }

    return (
        <div
            key={`expansion-${displayData.transactionId}`}
            className="px-18"
        >
            <div className="grid grid-cols-1 gap-4">
                {/* Dropdown to select team */}
                <ClaimExpansionDropdownRow
                    label="Team"
                    field="team"
                    options={teams}
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.team || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Dropdown to select program/project */}
                <ClaimExpansionDropdownRow
                    label="Program / Project"
                    field="program"
                    options={programs}
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.program || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Input for tags as comma-separated string */}
                <ClaimExpansionInputRow
                    label="Tags"
                    field="tags"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={getTagsValue(displayData.tags)}
                    handleInputChange={handleInputChange}
                />

                {/* Input for expense description */}
                <ClaimExpansionInputRow
                    label="Expense Description"
                    field="description"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.description || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Input for notes */}
                <ClaimExpansionInputRow
                    label="Notes"
                    field="notes"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.notes || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Attachment list and upload functionality */}
                <ClaimExpansionAttachmentRow
                    label="Attachments"
                    isEditing={isEditing}
                    files={displayData.attachments || []}
                    rowData={rowData}
                    handleInputChange={handleInputChange}
                />
            </div>
        </div>
    )
}

export default ClaimRowExpansion