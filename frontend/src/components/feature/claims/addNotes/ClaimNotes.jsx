import React from 'react'
import Note from './Note.jsx'
import ComponentContainer from '../../../common/ui/ComponentContainer.jsx'
import AddNote from './AddNote.jsx'

function ClaimNotes ({ notes,curClaim,mode }) {
    return (
        <ComponentContainer title="Notes">
            { notes && notes.length > 0 ?
                ( notes.map((note, index) => (
                    <Note key={ index } description={ note.description } date={ note.date }
                          submittedBy={ note.submittedBy }/> )) ) : ( <p>No notes available</p> )
            }

            {mode !== 'view' && <AddNote curClaim={curClaim}/>}

        </ComponentContainer>
    )
}

export default ClaimNotes