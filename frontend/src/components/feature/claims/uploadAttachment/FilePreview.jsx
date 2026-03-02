import React from 'react'
import { getFileIcon } from '../../../../utils/getFileIcon.jsx'

// Component to display a single file preview with icon, name link, and optional remove button
function FilePreview({ selectedFile, showRemoveButton = true, handleRemoveFile }) {

    // Check if there's a file - either a new upload or an existing file from backend
    if (!selectedFile || (!selectedFile.file && !selectedFile.url && !selectedFile.path)) return null

    // For new uploads: selectedFile has .file property
    // For existing files from backend: selectedFile has .url and .name but no .file
    const fileName = selectedFile.file ? selectedFile.file.name : (selectedFile.name || 'Attachment')
    const fileType = selectedFile.file ? selectedFile.file.type : 'application/octet-stream'
    const fileUrl = selectedFile.url || selectedFile.path

    // Don't render if there's no URL/path to access the file
    if (!fileUrl) return null

    return (
        <div className="mt-4 text-sm text-gray-700 flex items-center gap-1">

            {getFileIcon(fileType)}

            {/* Download link for the file */}
            <a
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
            >
                {fileName}
            </a>

            {/* Conditionally show remove button */}
            {showRemoveButton && (
                <button type="button" onClick={handleRemoveFile}
                    className="cursor-pointer text-red-500 ml-2 font-bold hover:text-red-700"><i className="pi pi-times"></i>
                </button>)}
        </div>
    )
}

export default FilePreview
