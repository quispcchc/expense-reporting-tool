import React, { useEffect, useState } from 'react'
import Note from './Note.jsx'
import ComponentContainer from '../../../common/ui/ComponentContainer.jsx'
import AddNote from './AddNote.jsx'
import { useTranslation } from 'react-i18next'

function ClaimNotes({ curClaim, mode, toastRef }) {
    const { t } = useTranslation()
    const [notes, setNotes] = useState(curClaim.claim_notes || []);

    const handleAddNote = (newNote) => {
        setNotes(prev => [...prev, newNote]); // prepend new note
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm w-full h-full flex flex-col">
            <div className="mb-4">
                <h5 className="text-xl font-semibold text-gray-800 mb-1">{t('claims.notes', 'Notes')}</h5>
                <p className="text-sm text-gray-500">{t('claims.notesDescription', 'Review notes and comments for this claim.')}</p>
            </div>
            {notes && notes.length > 0 ?
                (notes.map((note, index) => (
                    <Note key={index} description={note.claim_note_text} date={note.created_at}
                        submittedBy={note.user.full_name} />))) : (<p className="text-gray-500 text-sm mb-4">{t('claims.noNotes', 'No notes available')}</p>)
            }

            {mode !== 'view' && <AddNote curClaim={curClaim} onAddNote={handleAddNote} toastRef={toastRef} />}

        </div>
    )
}

export default ClaimNotes