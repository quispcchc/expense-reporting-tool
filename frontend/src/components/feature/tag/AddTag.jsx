import React, { useState, useEffect } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'

export default function AddTag({ onSave, onCancel, initialTag }) {
    const { t } = useTranslation()
    const [tagName, setTagName] = useState(initialTag ? initialTag.tag_name : '')
    const [error, setError] = useState('')
    useEffect(() => {
        setTagName(initialTag ? initialTag.tag_name : '')
    }, [initialTag])

    const handleSave = () => {
        if (!tagName.trim()) {
            setError(t('validation.tagNameRequired'))
            return
        }
        setError('')
        onSave(tagName)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InputText
                value={tagName}
                onChange={e => setTagName(e.target.value)}
                placeholder={t('tags.tagNamePlaceholder', t('tags.name'))}
                className={error ? 'p-invalid' : ''}
            />
            {error && <small style={{ color: 'red' }}>{error}</small>}
            <div style={{ display: 'flex', gap: 8 }}>
                <Button label={initialTag ? t('common.update', 'Update') : t('common.add', 'Add')} onClick={handleSave} />
                <Button label={t('common.cancel')} className="p-button-secondary" onClick={onCancel} />
            </div>
        </div>
    )
}
