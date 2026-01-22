import React from 'react'
import TagMultiSelect from '../TagMultiSelect.jsx'
import { useLookups } from '../../../../contexts/LookupContext.jsx'

// Generic multi-select row for tags, styled like ClaimExpansionInputRow
function ClaimExpansionMultiSelectRow({ label, field, value, isEditing, rowData, handleInputChange }) {
    const { lookups } = useLookups();

    console.log('tags value', value);

    // Helper to get tag names from IDs or objects
    const getTagNames = (val) => {
        if (!val || (Array.isArray(val) && val.length === 0)) return `No ${field} available.`;
        if (Array.isArray(val)) {
            // If array of objects (from backend), map to tag_name
            if (val.length && typeof val[0] === 'object' && val[0].tag_name) {
                return val.map(tag => tag.tag_name).join(', ');
            }
            // If array of IDs, map to tag_name using lookup
            return val.map(id => {
                if (typeof id === 'object' && id.tag_id && id.tag_name) {
                    return id.tag_name;
                }
                // Ensure id is a number for lookup
                const numericId = typeof id === 'string' && !isNaN(id) ? Number(id) : id;
                const tag = lookups.tags.find(t => t.tag_id === numericId);
                return tag ? tag.tag_name : id;
            }).join(', ');
        }
        // If single object
        if (typeof val === 'object' && val.tag_name) {
            return val.tag_name;
        }
        // If single ID
        const numericVal = typeof val === 'string' && !isNaN(val) ? Number(val) : val;
        const tag = lookups.tags.find(t => t.tag_id === numericVal);
        return tag ? tag.tag_name : val;
    };
    return (
        <div className="flex items-center gap-4">
            <label className="text-sm font-semibold min-w-[150px]">
                {label}
            </label>
            <div className="flex-1">
                {isEditing ? (
                    <TagMultiSelect
                        value={Array.isArray(value) ? value.map(v => (typeof v === 'object' ? v.tag_id : v)) : []}
                        onChange={val => handleInputChange(rowData.transactionId, field, val)}
                    />
                ) : (
                    <p className='text-sm text-text-secondary'>
                        {getTagNames(value)}
                    </p>
                )}
            </div>
        </div>
    )
}

export default ClaimExpansionMultiSelectRow
