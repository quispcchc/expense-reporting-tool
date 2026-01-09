import React from 'react'
import { getFileIcon } from './getFileIcon.jsx'

// Component to display a list of attached files with optional remove button
function AttachmentList({ files, showRemoveButton = true, handleRemoveFile }) {
    return (
        <ul className="mt-4 text-sm text-gray-700">
            {files && files.map((f, idx) => {
                const BASE_URL = 'http://localhost:8000'
                const isUploadedFile = !!f.file

                const fileName = isUploadedFile
                    ? f.file.name
                    : f.receipt_name

                const mimeType = isUploadedFile
                    ? f.file.type
                    : f.receipt_desc

                const fileUrl = isUploadedFile
                    ? f.url
                    : `${BASE_URL}/storage/${f.receipt_path}`

                    console.log('files',fileName,fileUrl);
                    

                return (
                    <li key={idx} className="flex items-center gap-2">
                        {/* Display file type icon based on the file's MIME type */}
                        {getFileIcon(mimeType)}

                        {/* Download link for the file */}
                        <a
                            href={fileUrl}
                            download={fileName}
                            className="text-blue-600 hover:underline"
                        >
                            {fileName}
                        </a>

                        {/* Conditionally show remove button */}
                        {showRemoveButton && (
                            <button type='button' onClick={() => handleRemoveFile(fileName)}
                                className="cursor-pointer text-red-500">X
                            </button>)}
                    </li>
                )
            })}
        </ul>
    )
}

export default AttachmentList