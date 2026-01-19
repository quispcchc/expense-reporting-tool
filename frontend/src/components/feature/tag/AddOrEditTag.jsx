import React, { useState, useEffect } from 'react'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'

export default function AddOrEditTag({ onSave, onCancel, initialTag }) {
    const [tagName, setTagName] = useState(initialTag ? initialTag.tag_name : '')
    const [error, setError] = useState('')

    useEffect(() => {
        setTagName(initialTag ? initialTag.tag_name : '')
    }, [initialTag])

    const handleSave = () => {
        if (!tagName.trim()) {
            setError('Tag name is required')
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
                placeholder="Tag name"
                className={error ? 'p-invalid' : ''}
            />
            {error && <small style={{ color: 'red' }}>{error}</small>}
            <div style={{ display: 'flex', gap: 8 }}>
                <Button label={initialTag ? 'Update' : 'Add'} onClick={handleSave} />
                <Button label="Cancel" className="p-button-secondary" onClick={onCancel} />
            </div>
        </div>
    )
}
