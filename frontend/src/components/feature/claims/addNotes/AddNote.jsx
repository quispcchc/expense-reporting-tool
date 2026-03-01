import React, { useState } from 'react'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import api from '../../../../api/api.js'
import { showToast } from '../../../../utils/helpers.js'
import { useTranslation } from 'react-i18next'

function AddNote({ curClaim, onAddNote, toastRef }) {
    const { t } = useTranslation()
    const [noteText, setNoteText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (noteText.trim() === '') {
            showToast(toastRef, { severity: 'info', summary: t('toast.info', 'Info'), detail: t('claims.pleaseEnterNote', 'Please enter note!') })
            return
        }

        setIsSubmitting(true)
        try {
            const response = await api.post('notes', {
                noteText,
                claim_id: curClaim.claim_id,
            })
            onAddNote(response.data)
            showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t('claims.noteSubmitted', 'Note submitted successfully!') })
            setNoteText('')
        }
        catch (error) {
            showToast(toastRef, { severity: 'error', summary: t('toast.error', 'Error'), detail: t('toast.errorOccurred', 'Error occurred!') })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    return (
        <div className="border-t border-gray-200 pt-2 sm:pt-3 mt-auto">
            <div className="flex items-between gap-2">
                <InputTextarea
                    rows={1}
                    autoResize
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    value={noteText}
                    placeholder={t('claims.enterText', 'Write a note...')}
                    className="flex-1"
                />
                <Button
                    icon="pi pi-send"
                    className="p-button-rounded p-button-sm"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting || noteText.trim() === ''}
                    tooltip={t('claims.submitNote', 'Submit Note')}
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        </div>
    )
}

export default AddNote
