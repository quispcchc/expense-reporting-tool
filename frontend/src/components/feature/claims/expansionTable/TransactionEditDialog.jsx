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
import BankStatementAttachment from '../BankStatementAttachment.jsx';
import { APPROVAL_STATUS } from '../../../../config/constants.js';
import { API_BASE_URL } from '../../../../api/api.js';

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
    mode,
    isCorporateCard,
    bankStatement
}) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(null);
    const [bankStatementUrl, setBankStatementUrl] = useState(null);

    useEffect(() => {
        if (transaction) {
            setFormData({ ...transaction });
        }
    }, [transaction]);

    useEffect(() => {
        if (bankStatement instanceof File) {
            const url = URL.createObjectURL(bankStatement);
            setBankStatementUrl(url);
            return () => URL.revokeObjectURL(url);
        } else if (typeof bankStatement === 'string') {
            setBankStatementUrl(`${API_BASE_URL}/api/storage/${bankStatement}`);
        } else {
            setBankStatementUrl(null);
        }
    }, [bankStatement]);

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr instanceof Date) return dateStr;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    if (!formData) return null;

    const handleInputChange = (field, value) => {
        let processedValue = value;
        if (field === 'transactionDate' && value instanceof Date) {
            // Format to YYYY-MM-DD in local time
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            processedValue = `${year}-${month}-${day}`;
        } else if (field === 'deletedReceiptIds') {
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
        onHide();
    };

    const handleRemoveFile = (indexToRemove) => {
        const currentAttachments = Array.isArray(formData.attachment) ? [...formData.attachment] : (formData.attachment ? [{...formData.attachment}] : []);
        const fileToRemove = currentAttachments[indexToRemove];
        
        let deletedReceiptId = null;
        if (fileToRemove?.receipt_id) {
            deletedReceiptId = fileToRemove.receipt_id;
        }

        const updatedAttachments = currentAttachments.filter((_, index) => index !== indexToRemove);
        handleInputChange('attachment', updatedAttachments);

        if (deletedReceiptId) {
            handleInputChange('deletedReceiptIds', deletedReceiptId);
        }
    };

    const isProcessed = Number(formData.status) === APPROVAL_STATUS.APPROVED || Number(formData.status) === APPROVAL_STATUS.REJECTED;

    const header = (
        <div className="flex flex-col lg:flex-row justify-between items-center w-full gap-4 pr-10 lg:pr-12 py-1">
            <div className="flex items-center gap-3 w-full lg:w-auto overflow-hidden">
                <span className="text-lg lg:text-xl font-extrabold text-gray-800 shrink-0 truncate">
                    {t('expenses.editExpense', 'Edit')} #{formData.transactionId}
                </span>
                <div className="flex items-center bg-gray-100 rounded-full px-1 py-1 border border-gray-200 shrink-0 scale-90 lg:scale-100 origin-left">
                    <Button
                        icon="pi pi-chevron-left"
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className="p-button-rounded p-button-text p-button-sm !p-2 shrink-0"
                        type="button"
                    />
                    <span className="text-sm font-bold text-gray-700 min-w-[80px] text-center px-2">
                        {currentIndex + 1} {t('common.of', 'of')} {totalCount}
                    </span>
                    <Button
                        icon="pi pi-chevron-right"
                        onClick={onNext}
                        disabled={!hasNext}
                        className="p-button-rounded p-button-text p-button-sm !p-2 shrink-0"
                        type="button"
                    />
                </div>
            </div>

            {isAdminOrApprover && mode !== 'VIEW' && (
                <div className="flex gap-2 w-full lg:w-auto justify-end">
                    <Button
                        label={t('claims.reject', 'Reject')}
                        icon="pi pi-times"
                        severity="danger"
                        outlined
                        onClick={() => onReject(formData.transactionId)}
                        disabled={isProcessed || processing}
                        loading={processing}
                        type="button"
                        className="p-button-sm font-bold flex-1 lg:flex-none"
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
                        className="p-button-sm font-bold flex-1 lg:flex-none"
                    />
                </div>
            )}
        </div>
    );

    const footer = (
        <div className="flex justify-end gap-3 w-full border-t pt-4 bg-white">
            <Button
                label={t('common.close', 'Close')}
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text text-gray-600 font-semibold"
                type="button"
            />
            <Button
                label={t('common.save', 'Save')}
                icon="pi pi-save"
                onClick={handleSave}
                disabled={processing}
                type="button"
                className="px-8 font-bold"
            />
        </div>
    );

    const attachments = Array.isArray(formData.attachment) ? formData.attachment : (formData.attachment ? [formData.attachment] : []);

    return (
        <Dialog
            header={header}
            visible={visible}
            style={{ width: '98vw', maxWidth: '1600px', maxHeight: '95vh' }}
            onHide={onHide}
            footer={footer}
            maximizable
            modal
            className="transaction-edit-dialog"
            contentClassName="!p-0"
            contentStyle={{ height: 'calc(95vh - 250px)', minHeight: '300px', overflowY: 'hidden' }}
        >
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Left Side: Editable Details with own scroll */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 border-b lg:border-b-0 lg:border-r bg-gray-50/20">
                    <div className="max-w-3xl mx-auto space-y-6 pb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-gray-700">{t('expenses.transactionDate')}</label>
                                <Calendar
                                    value={formData.transactionDate ? parseDate(formData.transactionDate) : null}
                                    onChange={(e) => handleInputChange('transactionDate', e.value)}
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
                                filter
                            />
                            <Select
                                label={t('expenses.costCentre')}
                                value={formData.costCentre}
                                options={lookups.costCentres.map(opt => ({ label: `${opt.cost_centre_code} - ${opt.description}`, value: opt.cost_centre_id }))}
                                onChange={(e) => handleInputChange('costCentre', e.target.value)}
                                filter
                            />
                        </div>

                        <Select
                            label={t('expenses.program')}
                            value={formData.program}
                            options={lookups.projects.map(opt => ({ label: `${opt.project_name} - ${opt.project_desc}`, value: opt.project_id }))}
                            onChange={(e) => handleInputChange('program', e.target.value)}
                            filter
                        />

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700">{t('expenses.tags')}</label>
                            <TagMultiSelect
                                value={Array.isArray(formData.tags) ? formData.tags : (formData.tags ? [formData.tags] : [])}
                                onChange={(e) => handleInputChange('tags', e.value)}
                            />
                        </div>

                        <Input
                            label={t('expenses.notes')}
                            value={formData.notes || ''}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            textarea
                            rows={3}
                        />

                        <Input
                            label={t('expenses.description')}
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            textarea
                            rows={3}
                        />
                    </div>
                </div>

                {/* Right Side: Attachments with own scroll */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-white">
                    <div className="max-w-3xl mx-auto pb-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800">{t('expenses.attachments', 'Attachments')}</h3>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {attachments.length > 0 ? attachments.length : (isCorporateCard && bankStatement ? 1 : 0)} {t('common.files', 'Files')}
                            </span>
                        </div>
                        
                        {/* Only show upload row if no individual attachments AND no bank statement fallback */}
                        {attachments.length === 0 && !(isCorporateCard && bankStatementUrl) && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-dashed border-gray-300">
                                <ClaimExpansionAttachmentRow
                                    label={null}
                                    file={formData.attachment || []}
                                    isEditing={true}
                                    rowData={formData}
                                    handleInputChange={(id, field, value) => handleInputChange(field, value)}
                                    hideFileList={true}
                                />
                            </div>
                        )}
                        
                        {attachments.length === 0 ? (
                            isCorporateCard && bankStatementUrl ? (
                                <div className="space-y-8">
                                    <div className="group border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                        <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                                            <div className="flex items-center gap-2 truncate max-w-[70%]">
                                                <i className="pi pi-file-pdf text-red-500"></i>
                                                <span className="text-sm font-bold text-gray-700 truncate">
                                                    {bankStatement instanceof File ? bankStatement.name : t('claimForm.bankStatement', 'Bank Statement')}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <a 
                                                    href={bankStatementUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title={t('common.open', 'Open')}
                                                >
                                                    <i className="pi pi-external-link text-sm"></i>
                                                </a>
                                                <a 
                                                    href={bankStatementUrl} 
                                                    download={bankStatement instanceof File ? bankStatement.name : 'BankStatement.pdf'}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title={t('common.download', 'Download')}
                                                >
                                                    <i className="pi pi-download text-sm"></i>
                                                </a>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            {/* Preview: check if it's image or pdf */}
                                            {(() => {
                                                const fileName = bankStatement instanceof File ? bankStatement.name : (typeof bankStatement === 'string' ? bankStatement : '');
                                                const ext = fileName.split('.').pop().toLowerCase();
                                                const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(ext);
                                                const isPdf = ext === 'pdf' || !ext; // Fallback to PDF if no extension for bank statement

                                                if (isImage) {
                                                    return (
                                                        <div className="flex justify-center bg-gray-100 rounded-lg overflow-hidden min-h-[200px]">
                                                            <img src={bankStatementUrl} alt="Bank Statement" className="max-w-full h-auto object-contain" />
                                                        </div>
                                                    );
                                                } else if (isPdf) {
                                                    return (
                                                        <iframe src={`${bankStatementUrl}#toolbar=0`} title="Bank Statement" className="w-full h-[500px] rounded-lg border" />
                                                    );
                                                } else {
                                                    return (
                                                        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                                            <i className="pi pi-file text-4xl mb-2"></i>
                                                            <p className="text-xs">{t('upload.previewNotAvailable', 'Preview not available')}</p>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                        <div className="bg-blue-50 p-3 border-t border-blue-100">
                                            <p className="text-xs text-blue-700 leading-relaxed italic">
                                                {t('expenses.bankStatementNotice', 'This expense was generated from a bank statement. No individual receipt was attached.')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-gray-100">
                                    <i className="pi pi-file-excel text-5xl mb-4 opacity-20"></i>
                                    <p className="text-sm font-medium">{t('upload.noAttachmentFound', 'No attachment found')}</p>
                                </div>
                            )
                        ) : (
                            <div className="space-y-8">
                                {attachments.map((file, index) => {
                                    const fileName = file.file ? file.file.name : (file.name || 'Attachment');
                                    const url = file.url || (file.receipt_path ? `${API_BASE_URL}/api/storage/${file.receipt_path}` : null);
                                    const ext = fileName.split('.').pop().toLowerCase();
                                    const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(ext);
                                    const isPdf = ext === 'pdf';

                                    if (!url) return null;

                                    return (
                                        <div key={index} className="group border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-700 truncate max-w-[70%]">{fileName}</span>
                                                <div className="flex gap-2">
                                                    <a 
                                                        href={url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title={t('common.open', 'Open')}
                                                    >
                                                        <i className="pi pi-external-link text-sm"></i>
                                                    </a>
                                                    <a 
                                                        href={url} 
                                                        download={fileName}
                                                        className="text-green-600 hover:text-green-800 p-1"
                                                        title={t('common.download', 'Download')}
                                                    >
                                                        <i className="pi pi-download text-sm"></i>
                                                    </a>
                                                    {mode === 'create' && (
                                                        <button 
                                                            onClick={() => handleRemoveFile(index)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            title={t('common.remove', 'Remove')}
                                                            type="button"
                                                        >
                                                            <i className="pi pi-trash text-sm"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                {isImage && (
                                                    <div className="flex justify-center bg-gray-100 rounded-lg overflow-hidden min-h-[200px]">
                                                        <img src={url} alt={fileName} className="max-w-full h-auto object-contain" />
                                                    </div>
                                                )}
                                                {isPdf && (
                                                    <iframe src={`${url}#toolbar=0`} title={fileName} className="w-full h-[500px] rounded-lg border" />
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
