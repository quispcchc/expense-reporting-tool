import React, { useState } from 'react'
import { Button } from 'primereact/button'
import Input from '../../common/ui/Input.jsx'
import UploadMileageAttachment from './UploadMileageAttachment.jsx'
import { useTranslation } from 'react-i18next'
import { validateForm } from '../../../utils/validation/validator.js'
import { validationSchemas } from '../../../utils/validation/schemas.js'

const initialDraft = {
    transaction_date: '',
    travel_from: '',
    travel_to: '',
    distance_km: '',
    meter_km: '',
    parking_amount: '',
    buyer: '',
}

function MileageTransactionForm({ mileageRate, onAddTransaction }) {
    const { t } = useTranslation()
    const [draft, setDraft] = useState(initialDraft)
    const [files, setFiles] = useState([])
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setDraft(prev => ({ ...prev, [name]: value }))
        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }))
        }
    }

    // Calculate draft total: distance * rate + parking + meter
    const draftTotal = (
        (parseFloat(draft.distance_km) || 0) * (parseFloat(mileageRate) || 0) +
        (parseFloat(draft.parking_amount) || 0) +
        (parseFloat(draft.meter_km) || 0)
    ).toFixed(2)

    const handleAdd = () => {
        const { isValid, errors: validationErrors } = validateForm(draft, validationSchemas.mileageTransaction)

        if (!isValid) {
            setErrors(validationErrors)
            return
        }

        onAddTransaction({
            ...draft,
            travel_from: draft.travel_from,
            travel_to: draft.travel_to,
            distance_km: parseFloat(draft.distance_km) || 0,
            meter_km: parseFloat(draft.meter_km) || 0,
            parking_amount: parseFloat(draft.parking_amount) || 0,
            mileage_rate: parseFloat(mileageRate) || 0,
            total_amount: parseFloat(draftTotal),
            attachment: files,
        })

        setDraft(initialDraft)
        setFiles([])
        setErrors({})
    }

    return (
        <div className="border border-gray-200 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-semibold mb-3">{t('mileage.addTransaction', 'Add Mileage Transaction')}</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    name="transaction_date"
                    label={t('mileage.transactionDate', 'Date') + '*'}
                    type="date"
                    value={draft.transaction_date}
                    onChange={handleChange}
                    errors={errors}
                />
                <Input
                    name="travel_from"
                    label={t('mileage.travelFrom', 'Travel From') + '*'}
                    value={draft.travel_from}
                    onChange={handleChange}
                    placeholder={t('mileage.travelFromPlaceholder', 'Enter departure location')}
                    errors={errors}
                />
                <Input
                    name="travel_to"
                    label={t('mileage.travelTo', 'Travel To') + '*'}
                    value={draft.travel_to}
                    onChange={handleChange}
                    placeholder={t('mileage.travelToPlaceholder', 'Enter destination')}
                    errors={errors}
                />
                <Input
                    name="distance_km"
                    label={t('mileage.distance', 'Distance (km)')}
                    inputMode="decimal"
                    value={draft.distance_km}
                    onChange={handleChange}
                    placeholder="0"
                    errors={errors}
                />
                <Input
                    name="meter_km"
                    label={t('mileage.meter', 'Meter (Max. $5/location)')}
                    inputMode="decimal"
                    value={draft.meter_km}
                    onChange={handleChange}
                    placeholder="0.00"
                    errors={errors}
                />
                <Input
                    name="parking_amount"
                    label={t('mileage.parking', 'Parking ($)')}
                    inputMode="decimal"
                    value={draft.parking_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    errors={errors}
                />
                <Input
                    name="buyer"
                    label={t('mileage.buyer', 'Buyer') + '*'}
                    value={draft.buyer}
                    onChange={handleChange}
                    placeholder={t('mileage.buyerPlaceholder', 'Enter buyer name')}
                    errors={errors}
                />
                <UploadMileageAttachment files={files} onSetFiles={setFiles} errors={{}} />
                <div className="flex items-end">
                    <div>
                        <p className="text-sm text-gray-500">{t('mileage.draftTotal', 'Draft Total')}</p>
                        <p className="text-lg font-semibold text-brand-primary">${draftTotal}</p>
                    </div>
                </div>
            </div>



            <div className="flex justify-end mt-3">
                <Button
                    label={t('mileage.addMileage', 'Add Mileage')}
                    type="button"
                    icon="pi pi-plus"
                    iconPos="right"
                    onClick={handleAdd}
                />
            </div>
        </div>
    )
}

export default MileageTransactionForm
