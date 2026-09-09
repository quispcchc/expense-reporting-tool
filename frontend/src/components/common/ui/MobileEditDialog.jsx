import React from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'

function MobileEditDialog({ visible, header, onHide, onSave, style, children }) {
    const { t } = useTranslation()
    const defaultStyle = { width: '90vw', maxWidth: '450px' }
    return (
        <Dialog
            header={header}
            visible={visible}
            style={style || defaultStyle}
            onHide={onHide}
            className="mobile-edit-dialog"
            footer={
                <div className="flex justify-end gap-2">
                    <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={onHide} type="button" />
                    <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={onSave} type="button" />
                </div>
            }
        >
            {children}
        </Dialog>
    )
}

export default MobileEditDialog
