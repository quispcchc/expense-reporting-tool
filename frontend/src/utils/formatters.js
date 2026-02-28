import { APP_SETTINGS } from '../config/settings.js'

export const formatCurrency = (amount) =>
    new Intl.NumberFormat(APP_SETTINGS.currency.locale, {
        style: 'currency',
        currency: APP_SETTINGS.currency.code,
    }).format(amount || 0)

export const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return typeof dateStr === 'string' ? dateStr.substring(0, 10) : String(dateStr)
}
