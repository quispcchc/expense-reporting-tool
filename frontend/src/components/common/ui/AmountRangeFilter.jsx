import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next'

const AmountRangeFilter = ({ options }) => {
    const { t } = useTranslation()
    const [startAmount, setStartAmount] = useState(options.value?.[0] || '');
    const [endAmount, setEndAmount] = useState(options.value?.[1] || '');

    // 🔹 Keep local state in sync with DataTable's filter value
    useEffect(() => {
        setStartAmount(options.value?.[0] || '');
        setEndAmount(options.value?.[1] || '');
    }, [options.value]);

    useEffect(() => {
        if (startAmount && endAmount) {
            options.filterApplyCallback([startAmount, endAmount]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startAmount, endAmount]);

    return (
        <div className="flex gap-1">
            <input
                type="text"
                value={startAmount}
                onChange={(e) => setStartAmount(e.target.value)}
                className="p-inputtext p-component min-w-20 w-100"
                placeholder={t('filters.from')}
            />
            <input
                type="text"
                value={endAmount}
                onChange={(e) => setEndAmount(e.target.value)}
                className="p-inputtext p-component min-w-20 w-100"
                placeholder={t('filters.to')}
            />
        </div>
    );
};

export default AmountRangeFilter;
