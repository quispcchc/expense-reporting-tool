import React from 'react'

function ComponentContainer({ title, children, headerRight }) {
    return (
        <div className="bg-white p-3 sm:p-4 md:p-6 rounded-2xl shadow-sm w-full h-full overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <h5 className="text-[22px]">{title}</h5>
                {headerRight && <div>{headerRight}</div>}
            </div>
            {children}
        </div>
    )
}

export default ComponentContainer