import React, { useEffect, useState } from 'react'
import Note from './Note.jsx'
import ComponentContainer from '../../../common/ui/ComponentContainer.jsx'
import AddNote from './AddNote.jsx'

function ClaimNotes ({ curClaim ,mode,toastRef}) {
    const [notes, setNotes] = useState(curClaim.claim_notes || []);

    const handleAddNote = (newNote) => {
        setNotes(prev => [ ...prev,newNote]); // prepend new note
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm overflow-y-auto max-h-92">
            <h5 className="text-[22px] mb-2">Notes</h5>
            { notes && notes.length > 0 ?
                ( notes.map((note, index) => (
                    <Note key={ index } description={ note.claim_note_text } date={ note.created_at }
                          submittedBy={ note.user.full_name }/> )) ) : ( <p>No notes available</p> )
            }

            {mode !=='view' && <AddNote curClaim={curClaim} onAddNote={handleAddNote} toastRef={toastRef}/>}

        </div>
    )
}

export default ClaimNotes