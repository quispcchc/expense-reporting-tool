import React from 'react'
import FilePreview from './FilePreview.jsx'

function AttachmentList({ files, onRemoveFile, showRemoveButton = true }) {
    if (!files || files.length === 0) return null

    return (
        <div className="flex flex-row flex-wrap gap-1">
            {files.map((file, index) => (
                <FilePreview
                    key={index}
                    selectedFile={file}
                    handleRemoveFile={() => onRemoveFile(index)}
                    showRemoveButton={showRemoveButton}
                />
            ))}
        </div>
    )
}

export default AttachmentList
