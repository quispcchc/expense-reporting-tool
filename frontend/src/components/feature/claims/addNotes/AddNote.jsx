import React, { useState } from 'react'
import { Button } from 'primereact/button'
import api from '../../../../api/api.js'

// Component to add a note to the current claim
function AddNote ({ curClaim,onAddNote }) {
    const [noteText, setNoteText] = useState('')

    // Handle form submission to add the note
    const handleSubmit = async(e) => {
        e.preventDefault()

        try {
            const response = await api.post('notes', {
                noteText,
                claim_id: curClaim.claim_id
            })
            const newNote = response.data
            console.log(response)
            onAddNote(newNote); // notify parent to update notes list
            setNoteText('');

        } catch (error) {
            console.error('Error adding note:', error);
        }

    }

    return (
        <div>
            <p className="mt-5 text-2xl">Add a Note</p>
            <div className='flex flex-col items-end gap-3'>
                    <textarea
                        name="note"
                        rows="3"
                        onChange={ (e) => setNoteText(e.target.value) }
                        value={ noteText }
                        placeholder="Enter a text..."
                        className="w-full border border-gray-300 rounded-md p-3 text-sm"
                    />
                <Button label="Submit Note" className='w-1/3' onClick={ handleSubmit }/>
            </div>
        </div>
    )
}

export default AddNote