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
    processing,
    currentIndex,
    totalCount,
    isAdminOrApprover,
    mode
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

    const header = (
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 pr-8">
            <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gray-800">
                    {t('expenses.editExpense', 'Edit Expense')} #{formData.transactionId}
                </span>
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1 text-sm font-medium text-gray-600">
                    <Button
                        icon="pi pi-chevron-left"
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className="p-button-text p-button-sm !p-0 mr-2"
                        type="button"
                    />
                    <span>{currentIndex + 1} {t('common.of', 'of')} {totalCount}</span>
                    <Button
                        icon="pi pi-chevron-right"
                        onClick={onNext}
                        disabled={!hasNext}
                        className="p-button-text p-button-sm !p-0 ml-2"
                        type="button"
                    />
                </div>
            </div>

            {isAdminOrApprover && mode !== 'VIEW' && (
                <div className="flex gap-2">
                    <Button
                        label={t('claims.reject', 'Reject')}
                        icon="pi pi-times"
                        severity="danger"
                        outlined
                        onClick={() => onReject(formData.transactionId)}
                        disabled={isProcessed || processing}
                        loading={processing}
                        type="button"
                        className="p-button-sm"
                    />
                    <Button
                        label={t('claims.approve', 'Approve')}
                        icon="pi pi-check"
                        severity="success"
                        outlined
                        onClick={() => onApprove(formData.transactionId)}
                        disabled={isProcessed || processing}
                        loading={processing}
                        type="button"
                        className="p-button-sm"
                    />
                </div>
            )}
        </div>
    );

    const footer = (
        <div className="flex justify-end gap-3 w-full border-t pt-4">
            <Button
                label={t('common.close', 'Close')}
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text text-gray-600"
                type="button"
            />
            <Button
                label={t('common.save', 'Save')}
                icon="pi pi-save"
                onClick={handleSave}
                disabled={processing}
                type="button"
                className="px-6"
            />
        </div>
    );

    const attachments = Array.isArray(formData.attachment) ? formData.attachment : (formData.attachment ? [formData.attachment] : []);

    return (
        <Dialog
            header={header}
            visible={visible}
            style={{ width: '95vw', maxWidth: '1400px' }}
            onHide={onHide}
            footer={footer}
            maximizable
            modal
            className="transaction-edit-dialog"
            contentClassName="!p-0"
        >
            <div className="flex flex-col lg:flex-row h-[70vh] lg:h-[75vh]">
                {/* Left Side: Editable Details with own scroll */}
                <div className="flex-1 overflow-y-auto p-6 border-b lg:border-b-0 lg:border-r bg-gray-50/30">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">{t('expenses.transactionDate')}</label>
                                <Calendar
                                    value={formData.transactionDate ? new Date(formData.transactionDate) : null}
                                    onChange={(e) => handleInputChange('transactionDate', e.value ? e.value.toISOString().split('T')[0] : null)}
                                    dateFormat="yy-mm-dd"
                                    showIcon
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">{t('expenses.amount')}</label>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label={t('expenses.vendor')}
                                value={formData.vendor || ''}
                                onChange={(e) => handleInputChange('vendor', e.target.value)}
                                className="w-full"
                            />
                            <Input
                                label={t('expenses.buyer')}
                                value={formData.buyer || ''}
                                onChange={(e) => handleInputChange('buyer', e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        </div>

                        <Select
                            label={t('expenses.program')}
                            value={formData.program}
                            options={lookups.projects.map(opt => ({ label: `${opt.project_name} - ${opt.project_desc}`, value: opt.project_id }))}
                            onChange={(e) => handleInputChange('program', e.target.value)}
                        />

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700">{t('expenses.tags')}</label>
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
                            rows={3}
                        />

                        <Input
                            label={t('expenses.notes')}
                            value={formData.notes || ''}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            textarea
                            rows={3}
                        />
                    </div>
                </div>

                {/* Right Side: Attachments with own scroll */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800">{t('expenses.attachments', 'Attachments')}</h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {attachments.length} {t('common.files', 'Files')}
                            </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-dashed border-gray-300">
                            <ClaimExpansionAttachmentRow
                                label={t('expenses.uploadNew', 'Add File')}
                                file={formData.attachment || []}
                                isEditing={true}
                                rowData={formData}
                                handleInputChange={(id, field, value) => handleInputChange(field, value)}
                            />
                        </div>
                        
                        {attachments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                                <i className="pi pi-file-excel text-5xl mb-4 opacity-20"></i>
                                <p className="text-sm font-medium">{t('upload.noAttachmentFound', 'No attachment found')}</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {attachments.map((file, index) => {
                                    const fileName = file.file ? file.file.name : (file.name || 'Attachment');
                                    const url = file.url || (file.path ? `${APP_SETTINGS.apiBaseUrl}/storage/${file.path}` : null);
                                    const ext = fileName.split('.').pop().toLowerCase();
                                    const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(ext);
                                    const isPdf = ext === 'pdf';

                                    if (!url) return null;

                                    return (
                                        <div key={index} className="group border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-700 truncate max-w-[80%]">{fileName}</span>
                                                <a 
                                                    href={url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <i className="pi pi-external-link text-sm"></i>
                                                </a>
                                            </div>
                                            <div className="p-2">
                                                {isImage && (
                                                    <div className="flex justify-center bg-gray-100 rounded-lg overflow-hidden min-h-[200px]">
                                                        <img src={url} alt={fileName} className="max-w-full h-auto object-contain" />
                                                    </div>
                                                )}
                                                {isPdf && (
                                                    <iframe src={url} title={fileName} className="w-full h-[500px] rounded-lg border" />
                                                )}
                                                {!isImage && !isPdf && (
                                                    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                                        <i className="pi pi-file text-4xl mb-2"></i>
                                                        <p className="text-xs">{t('upload.previewNotAvailable', 'Preview not available')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

export default TransactionEditDialog;
