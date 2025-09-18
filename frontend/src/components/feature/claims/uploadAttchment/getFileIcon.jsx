import React from 'react'

import {
    AiOutlineFile,
    AiOutlineFilePdf,
    AiOutlineFileImage,
    AiOutlineFileWord,
    AiOutlineFileExcel,
} from 'react-icons/ai'

// Returns an appropriate icon component based on the file's MIME type
export const getFileIcon = (fileType) => {
    // If the file is an image (e.g., image/png, image/jpeg)
    if (fileType.startsWith('image/')) {
        return <AiOutlineFileImage className="inline-block text-blue-500 mr-2"/>
    }

    // If the file is a PDF document
    if (fileType === 'application/pdf') {
        return <AiOutlineFilePdf className="inline-block text-red-500 mr-2"/>
    }

    // If the file is an Excel spreadsheet (older .xls format)
    if (fileType === 'application/vnd.ms-excel') {
        return <AiOutlineFileExcel className="inline-block text-green-500 mr-2"/>
    }

    // If the file is a Word document (.doc or .docx)
    if (fileType === 'application/msword' || fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return <AiOutlineFileWord className="inline-block text-blue-700 mr-2"/>
    }

    // Default icon for unsupported or unknown file types
    return <AiOutlineFile className="inline-block text-gray-500 mr-2"/>
}
