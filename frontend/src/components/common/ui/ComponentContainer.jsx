import React from 'react'

function ComponentContainer({ title, children }) {
    return (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-2xl shadow-sm w-full h-full overflow-hidden">
            <h5 className="text-[22px] mb-2">{title}</h5>
            {children}
        </div>
    )
}

export default ComponentContainer