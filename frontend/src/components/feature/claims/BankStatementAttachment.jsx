import React, { useEffect, useState } from 'react'
import { API_BASE_URL } from '../../../api/api.js'

// Accepts either:
//   bankStatementPath — a backend storage path (existing saved file)
//   file              — a File object (new local upload, not yet saved)
function BankStatementAttachment({ bankStatementPath, file }) {
    const [showPreview, setShowPreview] = useState(false)
    const [objectUrl, setObjectUrl] = useState(null)

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file)
            setObjectUrl(url)
            return () => URL.revokeObjectURL(url)
        }
    }, [file])

    const url = file ? objectUrl : (bankStatementPath ? `${API_BASE_URL}/api/storage/${bankStatementPath}` : null)
    const fileName = file ? file.name : 'Corporate Card Bank Statement'

    if (!url) return null

    return (
        <div className="mt-2">
            <div className="flex items-center justify-between">
                <a
                    href={url}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                >
                    <i className="pi pi-file-pdf text-red-500"></i>
                    {fileName}
                </a>
            </div>
        </div>
    )
}

export default BankStatementAttachment
