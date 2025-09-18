import React from 'react'

// Single row in the ClaimDetail table showing a title and its corresponding value
function ClaimDetailRow ({ title,value }) {
    return (
        <tr>
            <th className="text-left py-2 font-medium">{title}</th>
            <td className='py-2'>{ value }</td>
        </tr>
    )
}

export default ClaimDetailRow