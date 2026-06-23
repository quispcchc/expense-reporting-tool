import React, { useEffect, useState } from 'react'
import { getFileIcon } from '../../../../utils/getFileIcon.jsx'

function FilePreview({ selectedFile, showRemoveButton = true, handleRemoveFile }) {
    const [objectUrl, setObjectUrl] = useState(null)
    const [showPreview, setShowPreview] = useState(false)

    useEffect(() => {
        if (selectedFile?.file) {
            const url = URL.createObjectURL(selectedFile.file)
            setObjectUrl(url)
            return () => URL.revokeObjectURL(url)
        }
    }, [selectedFile?.file])

    if (!selectedFile || (!selectedFile.file && !selectedFile.url && !selectedFile.path)) return null

    const fileName = selectedFile.file ? selectedFile.file.name : (selectedFile.name || 'Attachment')
    const backendUrl = selectedFile.url || selectedFile.path

    const getTypeFromName = (name) => {
        const ext = name.split('.').pop().toLowerCase()
        const map = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel' }
        return map[ext] || 'application/octet-stream'
    }

    const fileType = selectedFile.file ? selectedFile.file.type : getTypeFromName(fileName)

    const previewUrl = selectedFile.file ? objectUrl : backendUrl

    if (!previewUrl) return null

    const isImage = fileType.startsWith('image/')
    const isPdf = fileType === 'application/pdf'
    const canPreview = isImage || isPdf

    return (
        <div className="mt-4 text-sm text-gray-700">

            {/* File name row */}
            <div className="flex items-center gap-1">
                {getFileIcon(fileType)}
                <a
                    href={previewUrl}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                >
                    {fileName}
                </a>
                {canPreview && (
                    <button
                        type="button"
                        onClick={() => setShowPreview(v => !v)}
                        className="cursor-pointer text-gray-500 ml-2 hover:text-gray-700 underline text-xs"
                    >
                        {showPreview ? 'Hide' : 'Preview'}
                    </button>
                )}
                {showRemoveButton && (
                    <button type="button" onClick={handleRemoveFile}
                        className="cursor-pointer text-red-500 ml-2 font-bold hover:text-red-700">
                        <i className="pi pi-times"></i>
                    </button>
                )}
            </div>

            {/* Inline preview */}
            {showPreview && isImage && (
                <img
                    src={previewUrl}
                    alt={fileName}
                    className="mt-2 max-w-full max-h-96 rounded border border-gray-200 object-contain"
                />
            )}
            {showPreview && isPdf && (
                <iframe
                    src={previewUrl}
                    title={fileName}
                    className="mt-2 w-full h-96 rounded border border-gray-200"
                />
            )}
        </div>
    )
}

export default FilePreview
