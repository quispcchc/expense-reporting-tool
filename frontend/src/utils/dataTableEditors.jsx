import React from 'react'
import { InputText } from 'primereact/inputtext'

export const textInputEditor = (editorOptions) => (
    <InputText
        type="text"
        value={editorOptions.value || ''}
        onChange={(e) => editorOptions.editorCallback(e.target.value)}
        className="w-full"
    />
)
