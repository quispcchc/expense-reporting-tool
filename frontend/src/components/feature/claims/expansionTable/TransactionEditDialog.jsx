import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { useTranslation } from 'react-i18next';
import Input from '../../../common/ui/Input.jsx';
import Select from '../../../common/ui/Select.jsx';
import { APP_SETTINGS } from '../../../../config/settings.js';
import { BUTTON_STYLE } from '../../../../utils/customizeStyle.js';
import TagMultiSelect from '../TagMultiSelect.jsx';
import ClaimExpansionAttachmentRow from './ClaimExpansionAttachmentRow.jsx';
import { APPROVAL_STATUS } from '../../../../config/constants.js';

function TransactionEditDialog({
    visible,
    onHide,
    transaction,
    onSave,
    onApprove,
    onReject,
    onNext,
    onPrev,
    hasNext,
    hasPrev,
    lookups,
    processing
}) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        if (transaction) {
            setFormData({ ...transaction });
        }
    }, [transaction]);

    if (!formData) return null;

    const handleInputChange = (field, value) => {
        let processedValue = value;
        if (field === 'deletedReceiptIds') {
            const existing = formData.deletedReceiptIds || [];
            const incoming = Array.isArray(value) ? value : [value];
            processedValue = [...existing, ...incoming];
        }

        setFormData(prev => ({
            ...prev,
            [field]: processedValue
        }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const isProcessed = formData.status === APPROVAL_STATUS.APPROVED || formData.status === APPROVAL_STATUS.REJECTED;

    const footer = (
        <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
                <Button
                    icon="pi pi-chevron-left"
                    onClick={onPrev}
                    disabled={!hasPrev}
                    className="p-button-text"
                    tooltip={t('common.previous', 'Previous')}
                    type="button"
                />
                <Button
                    icon="pi pi-chevron-right"
                    onClick={onNext}
                    disabled={!hasNext}
                    className="p-button-text"
                    tooltip={t('common.next', 'Next')}
                    type="button"
                />
            </div>
            <div className="flex gap-2">
                <Button
                    label={t('common.cancel', 'Cancel')}
                    icon="pi pi-times"
                    onClick={onHide}
                    className="p-button-text"
                    type="button"
                />
                <Button
                    label={t('claims.reject', 'Reject')}
                    icon="pi pi-times"
                    severity="danger"
                    onClick={() => onReject(formData.transactionId)}
                    disabled={isProcessed || processing}
                    loading={processing}
                    type="button"
                />
                <Button
                    label={t('claims.approve', 'Approve')}
                    icon="pi pi-check"
                    severity="success"
                    onClick={() => onApprove(formData.transactionId)}
                    disabled={isProcessed || processing}
                    loading={processing}
                    type="button"
                />
                <Button
                    label={t('common.save', 'Save')}
                    icon="pi pi-save"
                    onClick={handleSave}
                    disabled={processing}
                    type="button"
                />
            </div>
        </div>
    );

    const attachments = Array.isArray(formData.attachment) ? formData.attachment : (formData.attachment ? [formData.attachment] : []);

    return (
        <Dialog
            header={`${t('expenses.editExpense', 'Edit Expense')} #${formData.transactionId}`}
            visible={visible}
            style={{ width: '90vw', maxWidth: '1200px' }}
            onHide={onHide}
            footer={footer}
            maximizable
            modal
        >
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Side: Editable Details */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">{t('expenses.transactionDate')}</label>
                            <Calendar
                                value={formData.transactionDate ? new Date(formData.transactionDate) : null}
                                onChange={(e) => handleInputChange('transactionDate', e.value.toISOString().split('T')[0])}
                                dateFormat="yy-mm-dd"
                                showIcon
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">{t('expenses.amount')}</label>
                            <InputNumber
                                value={formData.amount}
                                onValueChange={(e) => handleInputChange('amount', e.value)}
                                mode="currency"
                                currency={APP_SETTINGS.currency.code}
                                locale={APP_SETTINGS.currency.locale}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <Input
                        label={t('expenses.vendor')}
                        value={formData.vendor || ''}
                        onChange={(e) => handleInputChange('vendor', e.target.value)}
                    />

                    <Input
                        label={t('expenses.buyer')}
                        value={formData.buyer || ''}
                        onChange={(e) => handleInputChange('buyer', e.target.value)}
                    />

                    <Select
                        label={t('expenses.accountNumber')}
                        value={formData.accountNum}
                        options={lookups.accountNums.map(opt => ({ label: `${opt.account_number} - ${opt.description}`, value: opt.account_number_id }))}
                        onChange={(e) => handleInputChange('accountNum', e.target.value)}
                    />

                    <Select
                        label={t('expenses.costCentre')}
                        value={formData.costCentre}
                        options={lookups.costCentres.map(opt => ({ label: `${opt.cost_centre_code} - ${opt.description}`, value: opt.cost_centre_id }))}
                        onChange={(e) => handleInputChange('costCentre', e.target.value)}
                    />

                    <Select
                        label={t('expenses.program')}
                        value={formData.program}
                        options={lookups.projects.map(opt => ({ label: `${opt.project_name} - ${opt.project_desc}`, value: opt.project_id }))}
                        onChange={(e) => handleInputChange('program', e.target.value)}
                    />

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{t('expenses.tags')}</label>
                        <TagMultiSelect
                            value={Array.isArray(formData.tags) ? formData.tags : (formData.tags ? [formData.tags] : [])}
                            onChange={(e) => handleInputChange('tags', e.value)}
                        />
                    </div>

                    <Input
                        label={t('expenses.description')}
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        textarea
                    />

                    <Input
                        label={t('expenses.notes')}
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        textarea
                    />
                </div>

                {/* Right Side: Attachments */}
                <div className="flex-1 border-l pl-6 overflow-y-auto max-h-[70vh]">
                    <h3 className="text-lg font-semibold mb-4">{t('expenses.attachments', 'Attachments')}</h3>
                    <ClaimExpansionAttachmentRow
                        label={t('expenses.attachments')}
                        file={formData.attachment || []}
                        isEditing={true}
                        rowData={formData}
                        handleInputChange={(id, field, value) => handleInputChange(field, value)}
                    />
                    
                    {attachments.length === 0 && (
                        <div className="mt-10 text-center text-gray-500 italic">
                            {t('upload.noAttachmentFound', 'No attachment found')}
                        </div>
                    )}

                    {/* Full size preview if available */}
                    <div className="mt-6">
                        {attachments.map((file, index) => {
                            const fileName = file.file ? file.file.name : (file.name || 'Attachment');
                            const url = file.url || (file.path ? `${APP_SETTINGS.apiBaseUrl}/storage/${file.path}` : null);
                            const ext = fileName.split('.').pop().toLowerCase();
                            const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(ext);
                            const isPdf = ext === 'pdf';

                            if (!url) return null;

                            return (
                                <div key={index} className="mb-4">
                                    <p className="text-sm font-medium mb-2">{fileName}</p>
                                    {isImage && (
                                        <img src={url} alt={fileName} className="w-full h-auto rounded border" />
                                    )}
                                    {isPdf && (
                                        <iframe src={url} title={fileName} className="w-full h-96 rounded border" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

export default TransactionEditDialog;
