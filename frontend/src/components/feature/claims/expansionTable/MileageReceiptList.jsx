import { getFileIcon } from '../uploadAttchment/getFileIcon.jsx'
import { useTranslation } from 'react-i18next'

const resolveFileInfo = (att) => ({
    name: att.file?.name || att.name || 'Attachment',
    type: att.file?.type || att.fileType || 'application/octet-stream',
    url: att.url || att.path,
})

function ReceiptItem({ att, isEditing, onRemove }) {
    const { name, type, url } = resolveFileInfo(att)

    return (
        <div className="inline-flex items-center gap-1 rounded bg-gray-50 px-2 py-1 text-xs">
            <span className="shrink-0 [&_svg]:mr-0">{getFileIcon(type)}</span>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate max-w-[100px]"
                title={name}
            >
                {name}
            </a>
            {isEditing && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="shrink-0 text-red-500 hover:text-red-700 cursor-pointer ml-0.5"
                >
                    <i className="pi pi-times text-[10px]" />
                </button>
            )}
        </div>
    )
}

function MileageReceiptList({ receipts, isEditing, txIndex, onUpload, onRemove }) {
    const { t } = useTranslation()

    if (receipts.length === 0 && !isEditing) {
        return <span className="text-gray-400 text-xs italic">—</span>
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {receipts.map((att, i) => (
                <ReceiptItem
                    key={i}
                    att={att}
                    isEditing={isEditing}
                    onRemove={() => onRemove(txIndex, i)}
                />
            ))}
            {isEditing && (
                <label className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors">
                    <i className="pi pi-upload text-[10px]" />
                    <span>{t('components.upload', 'Upload')}</span>
                    <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => onUpload(txIndex, e)}
                        className="hidden"
                    />
                </label>
            )}
        </div>
    )
}

export default MileageReceiptList
