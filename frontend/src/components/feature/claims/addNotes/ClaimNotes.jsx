import React, { useEffect, useRef, useState } from 'react'
import Note from './Note.jsx'
import AddNote from './AddNote.jsx'
import { useTranslation } from 'react-i18next'
import { VIEW_MODE } from '../../../../config/constants.js'

function ClaimNotes({ curClaim, mode, toastRef }) {
    const { t } = useTranslation()
    const [notes, setNotes] = useState(curClaim.claim_notes || [])
    const scrollRef = useRef(null)

    const handleAddNote = (newNote) => {
        setNotes(prev => [...prev, newNote])
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [notes.length])

    const sortedNotes = [...notes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm w-full h-full flex flex-col">
            <div className="mb-3 sm:mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-lg sm:text-xl font-semibold text-gray-800">{t('claims.notes', 'Notes')}</h5>
                    <span className="bg-gray-200 text-gray-600 text-xs font-semibold rounded-full px-2 py-0.5">{notes.length}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">{t('claims.notesDescription', 'Review notes and comments for this claim.')}</p>
            </div>

            <div ref={scrollRef} className="overflow-y-auto max-h-48 flex-1 pr-1 mb-3 sm:mb-4">
                {sortedNotes.length > 0 ? (
                    sortedNotes.map((note, index) => (
                        <Note
                            key={note.claim_note_id || index}
                            description={note.claim_note_text}
                            date={note.created_at}
                            submittedBy={note.user.full_name}
                        />
                    ))
                ) : (
                    <p className="text-gray-400 text-sm text-center py-4">{t('claims.noNotes', 'No notes available')}</p>
                )}
            </div>

            {mode !== VIEW_MODE.VIEW && <AddNote curClaim={curClaim} onAddNote={handleAddNote} toastRef={toastRef} />}
        </div>
    )
}

export default ClaimNotes
