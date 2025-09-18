import React from 'react'

function Note ({submittedBy,date,description}) {
    return (
        <div className="bg-[#F8F8F8] p-5 rounded-sm mb-3">
            <div className="flex justify-between">
                <p>{submittedBy}</p>
                <p>{date}</p>
            </div>
            <p>{description}</p>
        </div>
    )
}

export default Note