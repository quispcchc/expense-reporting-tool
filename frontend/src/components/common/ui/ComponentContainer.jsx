import React from 'react'

function ComponentContainer ({title,children}) {
    return (
        <div className="bg-white h-full p-6 rounded-2xl shadow-sm">
            <h5 className="text-[22px] mb-2">{ title }</h5>
            { children }
        </div>
    )
}

export default ComponentContainer