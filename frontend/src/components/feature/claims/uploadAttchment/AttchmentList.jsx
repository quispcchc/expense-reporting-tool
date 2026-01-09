import React from 'react'
import { getFileIcon } from './getFileIcon.jsx'

// Component to display a list of attached files with optional remove button
function AttachmentList ({ selectedFile, showRemoveButton = true, handleRemoveFile }) {

    // Check if there's a file - either a new upload or an existing file from backend
    if (!selectedFile || (!selectedFile.file && !selectedFile.url)) return null

    console.log('selectedFile',selectedFile)

    // For new uploads: selectedFile has .file property
    // For existing files from backend: selectedFile has .url and .name but no .file
    const fileName = selectedFile.file ? selectedFile.file.name : selectedFile.name
    const fileType = selectedFile.file ? selectedFile.file.type : 'application/octet-stream'
    const fileUrl = selectedFile.url

    return (
        <div className="mt-4 text-sm text-gray-700">

            { getFileIcon(fileType) }

            {/* Download link for the file */ }
            <a
                href={ fileUrl }
                download={ fileName }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                { fileName }
            </a>

            {/* Conditionally show remove button */ }
            { showRemoveButton && (
                <button type="button" onClick={ () => handleRemoveFile(fileName) }
                        className="cursor-pointer text-red-500 ml-2">X
                </button> ) }
        </div>
    )
}

export default AttachmentList