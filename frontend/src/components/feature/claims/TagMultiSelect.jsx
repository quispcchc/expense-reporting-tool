import React from 'react'
import { MultiSelect } from 'primereact/multiselect'
import { useLookups } from '../../../contexts/LookupContext.jsx'
import { useTranslation } from 'react-i18next'
import { useTags } from '../../../contexts/TagContext.jsx'

export default function TagMultiSelect({ value, onChange }) {
    const { t } = useTranslation()
    const { lookups, loading } = useLookups()
    const { tags } = useTags()

    return (
        <div className="w-80">
            <MultiSelect
                value={value}
                options={tags}
                optionLabel="tag_name"
                optionValue="tag_id"
                onChange={e => onChange(e.value)}
                placeholder={t('expenses.tagsPlaceholder', 'Select tags...')}
                display="chip"
                loading={loading}
                className="w-80"
                filter
            />
        </div>
    )
}
