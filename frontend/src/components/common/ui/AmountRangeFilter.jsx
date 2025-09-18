import React, { useState, useEffect } from 'react';

const AmountRangeFilter = ({ options }) => {
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
    }, [startAmount, endAmount]);

    return (
        <div className="flex gap-1">
            <input
                type="text"
                value={startAmount}
                onChange={(e) => setStartAmount(e.target.value)}
                className="p-inputtext p-component min-w-20 w-100"
                placeholder="from"
            />
            <input
                type="text"
                value={endAmount}
                onChange={(e) => setEndAmount(e.target.value)}
                className="p-inputtext p-component min-w-20 w-100"
                placeholder="to"
            />
        </div>
    );
};

export default AmountRangeFilter;
