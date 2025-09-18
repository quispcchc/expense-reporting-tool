import React from 'react'
import { getFileIcon } from './getFileIcon.jsx'

// Component to display a list of attached files with optional remove button
function AttachmentList ({ files, showRemoveButton=true,handleRemoveFile}) {
    return (
        <ul className="mt-4 text-sm text-gray-700">
            { files && files.map((f, idx) => (
                <li key={ idx } className="flex items-center gap-2">
                    {/* Display file type icon based on the file's MIME type */}
                    { getFileIcon(f.file.type) }

                    {/* Download link for the file */}
                    <a
                        href={ f.url }
                        download={ f.file.name }
                        className="text-blue-600 hover:underline"
                    >
                        { f.file.name }
                    </a>

                    {/* Conditionally show remove button */}
                    { showRemoveButton && (
                        <button type='button' onClick={ () => handleRemoveFile(f.file.name) }
                                className="cursor-pointer text-red-500">X
                        </button> ) }
                </li>
            )) }
        </ul>
    )
}

export default AttachmentList