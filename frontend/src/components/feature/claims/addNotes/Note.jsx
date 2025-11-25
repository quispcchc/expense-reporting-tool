import React from 'react'

function Note ({submittedBy,date,description}) {
    const myDate =  new Date(date)

    const formattedDate = myDate.getFullYear() + '-' +
        String(myDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(myDate.getDate()).padStart(2, '0') + ' ' +
        String(myDate.getHours()).padStart(2, '0') + ':' +
        String(myDate.getMinutes()).padStart(2, '0') + ':' +
        String(myDate.getSeconds()).padStart(2, '0');

    return (
        <div className="bg-[#F8F8F8] p-5 rounded-sm mb-3">
            <div className="flex justify-between">
                <p>{submittedBy}</p>
                <p>{formattedDate}</p>
            </div>
            <p>{description}</p>
        </div>
    )
}

export default Note