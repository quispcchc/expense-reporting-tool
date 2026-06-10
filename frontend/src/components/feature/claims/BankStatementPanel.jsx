import React from 'react'
import { useTranslation } from 'react-i18next'
import ComponentContainer from '../../common/ui/ComponentContainer.jsx'
import { API_BASE_URL } from '../../../api/api.js'

/**
 * Persistent side-panel for corporate-card claims showing the single
 * bank-statement PDF inline. Renders to the right of the expense table
 * so the reviewer can cross-check each transaction against the statement
 * without opening per-row dialogs.
 */
function BankStatementPanel({ curClaim }) {
    const { t } = useTranslation()
    const path = curClaim?.bank_statement_path
    if (!path) return null

    const url = `${API_BASE_URL}/api/storage/${path}`
    const filename = path.split('/').pop() || 'bank-statement.pdf'

    return (
        <ComponentContainer>
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <h5 className="text-lg sm:text-xl font-semibold text-gray-800">
                        {t('claimForm.bankStatement', 'Bank Statement')}
                    </h5>
                    <p className="text-xs sm:text-sm text-gray-500">
                        {t('claims.bankStatementPanelDescription', 'Reference document for every expense in this claim.')}
                    </p>
                </div>
                <a
                    href={url}
                    download={filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap flex items-center gap-1"
                >
                    <i className="pi pi-download" />
                    {t('common.download', 'Download')}
                </a>
            </div>

            <iframe
                src={url}
                title={filename}
                className="w-full rounded border border-gray-200"
                style={{ height: 'calc(100vh - 240px)', minHeight: '600px' }}
            />
        </ComponentContainer>
    )
}

export default BankStatementPanel
