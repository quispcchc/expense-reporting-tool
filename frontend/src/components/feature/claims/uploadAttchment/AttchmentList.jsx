import React from 'react'
import { getFileIcon } from './getFileIcon.jsx'

// Component to display a list of attached files with optional remove button
function AttachmentList ({ selectedFile, showRemoveButton = true, handleRemoveFile }) {

    if (!selectedFile?.file) return null

    console.log('selectedFile',selectedFile)


    return (
        <div className="mt-4 text-sm text-gray-700">

            { getFileIcon(selectedFile.file.type) }

            {/* Download link for the file */ }
            <a
                href={ selectedFile.url }
                download={ selectedFile.file.name }
                className="text-blue-600 hover:underline"
            >
                { selectedFile.file.name }
            </a>

            {/* Conditionally show remove button */ }
            { showRemoveButton && (
                <button type="button" onClick={ () => handleRemoveFile(selectedFile.file.name) }
                        className="cursor-pointer text-red-500">X
                </button> ) }
            {/*</li>*/ }
            {/*)) }*/ }
        </div>
    )
}

export default AttachmentList