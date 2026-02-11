import React from "react";
import { Button } from "primereact/button";
import MileageTransactionRow from './MileageTransactionRow.jsx';

export default function MileageTransactions({ mileageData, setMileageData }) {
  const addTransaction = () => {
    setMileageData((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        {
          transaction_date: "",
          distance_km: "",
          meter_km: "",
          parking_amount: "",
          buyer: "",
          receipts: [], // files
        },
      ],
    }));
  };

  const removeTransaction = (index) => {
    setMileageData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Mileage Transactions</h4>
        <Button type="button" label="Add Transaction" icon="pi pi-plus" onClick={addTransaction} />
      </div>

      {mileageData.transactions.map((tx, idx) => (
        <MileageTransactionRow
          key={idx}
          index={idx}
          tx={tx}
          setMileageData={setMileageData}
          onRemove={() => removeTransaction(idx)}
        />
      ))}
    </div>
  );
}
