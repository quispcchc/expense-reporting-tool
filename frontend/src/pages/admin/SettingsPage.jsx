import React, { useState, useEffect, useRef } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { Button } from 'primereact/button'
import Input from '../../components/common/ui/Input.jsx'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import api from '../../api/api.js'

function SettingsPage() {
    const { t } = useTranslation()
    const toast = useRef(null)
    const [rate, setRate] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await api.get('settings')
            if (response.data?.mileage_rate !== undefined) {
                setRate(response.data.mileage_rate)
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        }
    }

    const handleRateSubmit = async () => {
        setLoading(true)
        try {
            await api.put('settings', { mileage_rate: rate })
            toast.current?.show({
                severity: 'success',
                summary: t('toast.success', 'Success'),
                detail: t('settings.saved', 'Settings saved successfully'),
            })
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: t('toast.error', 'Error'),
                detail: t('settings.saveFailed', 'Failed to save settings'),
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Toast ref={toast} />
            <div className='flex justify-between flex-wrap items-center gap-2'>
                <ContentHeader title={t('sidebar.settings')} homePath="/admin" iconKey="sidebar.settings" />
                <Button label={t('common.save')} onClick={handleRateSubmit} loading={loading} />
            </div>

            <form className="bg-white rounded-xl p-6">
                <Input
                    label={t('settings.mileageRate', 'Default mileage rate (per km)')}
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                />
            </form>
        </>
    )
}

export default SettingsPage
