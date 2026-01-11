import React, { useState } from 'react'
import ContentHeader from '../../components/common/layout/ContentHeader.jsx'
import { Button } from 'primereact/button'
import Input from '../../components/common/ui/Input.jsx'
import { useTranslation } from 'react-i18next'

function SettingsPage() {
    const { t } = useTranslation()
    const [rate, setRate] = useState(0.5)

    const handleRateSubmit = (e) => {
        console.log(rate)
    }
    return (
        <>
            <div className='flex justify-between'>
                <ContentHeader title={t('sidebar.settings')} homePath="/admin" />
                <Button label={t('common.save')} onClick={handleRateSubmit} />

            </div>

            <form className="bg-white rounded-xl p-6">
                <Input label={t('settings.mileageRate', 'Default mileage rate(per km)')} type="number" value={rate}
                    onChange={(e) => setRate(e.target.value)} />
            </form>
        </>
    )


}

export default SettingsPage