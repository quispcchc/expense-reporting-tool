import React from 'react'

// A reusable Upload button component that allows users to select and upload multiple files
function Upload ({ handleFileSelect }) {
    return (
        // Custom-styled label that acts as a button for file upload
        <label
            className="p-button p-component p-button-outlined p-2 cursor-pointer flex items-center gap-2">
            Upload a file
            <input
                type="file"
                accept='image/*,application/pdf'
                onChange={ handleFileSelect }
                className="hidden"
            />
            <i className="pi pi-cloud-upload"></i>
        </label>
    )
}

export default Upload