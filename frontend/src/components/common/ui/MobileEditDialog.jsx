import React from 'react'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { useTranslation } from 'react-i18next'

function MobileEditDialog({ visible, header, onHide, onSave, children }) {
    const { t } = useTranslation()
    return (
        <Dialog
            header={header}
            visible={visible}
            style={{ width: '90vw', maxWidth: '450px' }}
            onHide={onHide}
            className="mobile-edit-dialog"
            footer={
                <div className="flex justify-end gap-2">
                    <Button label={t('common.cancel', 'Cancel')} icon="pi pi-times" outlined onClick={onHide} />
                    <Button label={t('common.save', 'Save')} icon="pi pi-check" onClick={onSave} />
                </div>
            }
        >
            {children}
        </Dialog>
    )
}

export default MobileEditDialog
