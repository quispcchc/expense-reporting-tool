import ClaimExpansionDropdownRow from './ClaimExpansionDropdownRow.jsx'
import ClaimExpansionInputRow from './ClaimExpansionInputRow.jsx'
import ClaimExpansionAttachmentRow from './ClaimExpansionAttachmentRow.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import ClaimExpansionMultiSelectRow from './ClaimExpansionMultiSelectRow.jsx'
import MileageDetailsSection from './MileageDetailsSection.jsx'


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

    const isEditing = editingRowId === rowData.transactionId

    const currentData = claimItems.find(item => item.transactionId === rowData.transactionId) || rowData
    const expansionChanges = expandedRowData[rowData.transactionId] || {}

    const displayData = {
        ...currentData,
        ...expansionChanges,
        attachment: Object.prototype.hasOwnProperty.call(expansionChanges, 'attachment')
            ? expansionChanges.attachment
            : currentData.attachment
    }

    return (
        <div
            key={`expansion-${displayData.transactionId}`}
            className="px-18"
        >
            <div className="grid grid-cols-1 gap-4">
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

                <ClaimExpansionMultiSelectRow
                    label={t('expenses.tags', 'Tags')}
                    field="tags"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={Array.isArray(displayData.tags)
                        ? displayData.tags
                        : (displayData.tags ? [displayData.tags] : [])}
                    handleInputChange={handleInputChange}
                />

                <ClaimExpansionInputRow
                    label={t('expenses.description')}
                    field="description"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.description || ''}
                    handleInputChange={handleInputChange}
                />

                <ClaimExpansionInputRow
                    label={t('expenses.notes')}
                    field="notes"
                    isEditing={isEditing}
                    rowData={rowData}
                    value={displayData.notes || ''}
                    handleInputChange={handleInputChange}
                />

                <ClaimExpansionAttachmentRow
                    label={t('expenses.attachments')}
                    isEditing={isEditing}
                    file={displayData.attachment || null}
                    rowData={rowData}
                    handleInputChange={handleInputChange}
                    mode={mode}
                />

                {displayData.mileage?.transactions?.length > 0 && (
                    <MileageDetailsSection
                        mileage={displayData.mileage}
                        isEditing={isEditing}
                        rowData={rowData}
                        handleInputChange={handleInputChange}
                    />
                )}
            </div>
        </div>
    )
}

export default ClaimRowExpansion
