import React from "react";
import Input from "../../common/ui/Input.jsx";
import { Button } from "primereact/button";
import MileageReceiptInput from './MileageReceiptInput.jsx';

export default function MileageTransactionRow({ index, tx, setMileageData, onRemove }) {
  const updateTxField = (e) => {
    const { name, value } = e.target;

    setMileageData((prev) => {
      const updated = [...prev.transactions];
      updated[index] = { ...updated[index], [name]: value };
      return { ...prev, transactions: updated };
    });
  };

  return (
    <div className="border rounded-md p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Transaction Date"
          type="date"
          name="transaction_date"
          value={tx.transaction_date??""}
          onChange={updateTxField}
        />

        <Input
          label="Distance (KM)"
          type="number"
          name="distance_km"
          value={tx.distance_km??""}
          onChange={updateTxField}
        />

        <Input
          label="Meter (KM)"
          type="number"
          name="meter_km"
          value={tx.meter_km??""}
          onChange={updateTxField}
        />

        <Input
          label="Parking Amount"
          type="number"
          name="parking_amount"
          value={tx.parking_amount??""}
          onChange={updateTxField}
        />

        <Input
          label="Buyer"
          name="buyer"
          value={tx.buyer??""}
          onChange={updateTxField}
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Receipts (optional)</label>
        <MileageReceiptInput
            files={tx.receipts}
            onChange={(files) => {
                setMileageData(prev => {
                const updated = [...prev.transactions];
                updated[index] = { ...updated[index], receipts: files };
                return { ...prev, transactions: updated };
                });
         }}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" label="Remove" icon="pi pi-trash" severity="danger" onClick={onRemove} />
      </div>
    </div>
  );
}
