import React, { useState } from 'react'
import { useClaims } from '../../../../contexts/ClaimContext.jsx'
import { useAuth } from '../../../../contexts/AuthContext.jsx'
import { Button } from 'primereact/button'

// Component to add a note to the current claim
function AddNote ({ curClaim }) {
    const [noteText, setNoteText] = useState('')
    const { updateClaim } = useClaims()
    const { authUser } = useAuth()

    // Handle form submission to add the note
    const handleSubmit = (e) => {
        e.preventDefault()

        // Format current date as YYYY-MM-DD
        const formattedDate = new Date().toISOString().split('T')[ 0 ]

        // Update the current claim with the new note
        updateClaim({
            ...curClaim,
            notes: [
                ...curClaim.notes, {
                    description: noteText,
                    submittedBy: authUser.full_name,
                    date: formattedDate,
                },
            ],
        })

        // Clear the input field after submission
        setNoteText('')
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