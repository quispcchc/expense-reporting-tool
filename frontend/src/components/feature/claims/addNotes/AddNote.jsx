import React, { useState } from 'react'
import { Button } from 'primereact/button'
import api from '../../../../api/api.js'
import { showToast } from '../../../../utils/helpers.js'
import { useTranslation } from 'react-i18next'

// Component to add a note to the current claim
function AddNote({ curClaim, onAddNote, toastRef }) {
    const { t } = useTranslation()
    const [noteText, setNoteText] = useState('')

    // Handle form submission to add the note
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (noteText === '') {
            showToast(toastRef, { severity: 'info', summary: t('toast.info', 'Info'), detail: t('claims.pleaseEnterNote', 'Please enter note!') })
            return
        }

        try {
            const response = await api.post('notes', {
                noteText,
                claim_id: curClaim.claim_id,
            })
            const newNote = response.data
            onAddNote(newNote) // notify parent to update notes list
            showToast(toastRef, { severity: 'success', summary: t('toast.success', 'Success'), detail: t('claims.noteSubmitted', 'Note submitted successfully!') })

            setNoteText('')

        }
        catch (error) {
            console.error('Error adding note:', error)
            showToast(toastRef, { severity: 'error', summary: t('toast.error', 'Error'), detail: t('toast.errorOccurred', 'Error occurred!') })
        }

    }

    return (
        <div>
            <h6 className="text-base font-medium text-gray-700 mt-4 mb-2">{t('claims.addNote', 'Add a Note')}</h6>
            <div className="flex flex-col items-end gap-3">
                <textarea
                    name="note"
                    rows="3"
                    onChange={(e) => setNoteText(e.target.value)}
                    value={noteText}
                    placeholder={t('claims.enterText', 'Enter a text...')}
                    className="w-full border border-gray-300 rounded-md p-3 text-sm"
                />
                <Button label={t('claims.submitNote', 'Submit Note')} className="w-1/3" onClick={handleSubmit} />
            </div>
        </div>
    )
}

export default AddNote