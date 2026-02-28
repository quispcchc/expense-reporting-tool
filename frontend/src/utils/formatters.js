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

export const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
