import React from 'react'
import ClaimExpansionDropdownRow from './ClaimExpansionDropdownRow.jsx'
import ClaimExpansionInputRow from './ClaimExpansionInputRow.jsx'
import ClaimExpansionAttachmentRow from './ClaimExpansionAttachmentRow.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'

function ClaimRowExpansion({
    rowData,
    editingRowId,
    claimItems,
    expandedRowData,
    handleInputChange
}) {
    const {lookups:{departments,projects}} = useLookups()

    // Determine if the current row is in editing mode
    const isEditing = editingRowId === rowData.transactionId

    // Get the original claim item data for this row
    const currentData = claimItems.find(item => item.transactionId === rowData.transactionId) || rowData
    console.log('claimItems',claimItems)
    console.log('current data',currentData)

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
                 {/*Dropdown to select team*/}
                <ClaimExpansionDropdownRow
                    label="Team"
                    field="team"
                    placeholder='Please select the team'
                    options={departments.map(opt=>({label:opt.department_name,value:opt.department_id}))}
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.team || ''}
                    handleInputChange={handleInputChange}
                />

                {/* Dropdown to select program/project */}
                <ClaimExpansionDropdownRow
                    label="Program / Project"
                    field="program"
                    placeholder='Please select the program'
                    options={projects.map(opt=>({label:`${opt.project_name} - ${opt.project_desc}`,value:opt.project_id}))}
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
                    label="Attachment"
                    isEditing={isEditing}
                    file={displayData.attachment || null}
                    rowData={rowData}
                    handleInputChange={handleInputChange}
                />
            </div>
        </div>
    )
}

export default ClaimRowExpansion