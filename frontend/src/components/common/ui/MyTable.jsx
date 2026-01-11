import React from 'react'

function MyTable({ headers, data, renderRow }) {

    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="border-collapse w-full">
                <thead className="bg-bg-secondary text-left">
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} className="border-b border-gray-300 p-3">{header}</th>
                        ))}
                    </tr>
                </thead>

                <tbody className='p-3'>
                    {data.map((item, index) => (
                        <React.Fragment key={index}>
                            {renderRow(item)}
                        </React.Fragment>
                    ))
                    }
                </tbody>
            </table>
        </div>
    )
}

export default MyTable
