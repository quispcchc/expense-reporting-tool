import React, { useState, useEffect } from 'react';
import { Calendar } from 'primereact/calendar'
import { useTranslation } from 'react-i18next'

const DateRangeFilter = ({ options }) => {
    const { t } = useTranslation()
    const [startDate, setStartDate] = useState(options.value?.[0] || '');
    const [endDate, setEndDate] = useState(options.value?.[1] || '');

    // Keep local state in sync with DataTable's filter value
    useEffect(() => {
        setStartDate(options.value?.[0] || '');
        setEndDate(options.value?.[1] || '');

    }, [options.value]);

    useEffect(() => {
        if (startDate && endDate) {
            options.filterApplyCallback([startDate, endDate]);
        }
    }, [startDate, endDate]);

    return (
        <div className="flex gap-1">
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-inputtext p-component"
                placeholder={t('filters.startDate')}
            />
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-inputtext p-component"
                placeholder={t('filters.endDate')}
            />

        </div>
    );
};

export default DateRangeFilter;
