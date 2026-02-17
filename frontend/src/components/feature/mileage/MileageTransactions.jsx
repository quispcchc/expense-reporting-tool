import React, { useMemo, useState } from "react";
import { Button } from "primereact/button";
import Input from "../../common/ui/Input.jsx";
import MileageReceiptsInput from "./MileageReceiptsInput.jsx";


const emptyDraft = {
  meter_km: "",
  parking_amount: "",
  distance_km: "",
  buyer: "",
  transaction_date: "",
  receipts: [], // files
};

export default function MileageTransactions({ mileageData, setMileageData }) {
  const [txDraft, setTxDraft] = useState(emptyDraft);

  const totalAmount = useMemo(() => {
    const meter = Number(txDraft.meter_km || 0);
    const parking = Number(txDraft.parking_amount || 0);
    return meter + parking;
  }, [txDraft.meter_km, txDraft.parking_amount]);

  const onDraftChange = (e) => {
    const { name, value } = e.target;
    setTxDraft((prev) => ({ ...prev, [name]: value }));
  };

  const addMileage = () => {
    if (!txDraft.transaction_date || !txDraft.distance_km) return;

    setMileageData((prev) => ({
      ...prev,
      transactions: [...(prev.transactions || []), { ...txDraft }],
    }));

    setTxDraft(emptyDraft);
  };

  const removeRow = (index) => {
    setMileageData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="mt-3">
      {/* Transactions panel */}
      <div className="border rounded-xl p-4 bg-white">
        <div className="inline-block px-3 py-1 border rounded-md text-sm font-medium bg-gray-50 -mt-7">
          Transactions
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Input
            label="Meter (Max: $5 per location)"
            type="number"
            name="meter_km"
            value={txDraft.meter_km}
            onChange={onDraftChange}
          />

          <Input
            label="Parking with receipt"
            type="number"
            name="parking_amount"
            value={txDraft.parking_amount}
            onChange={onDraftChange}
          />

          <Input
            label="Distance (kms)"
            type="number"
            name="distance_km"
            value={txDraft.distance_km}
            onChange={onDraftChange}
          />

          <Input
            label="Buyer"
            name="buyer"
            value={txDraft.buyer}
            onChange={onDraftChange}
          />

          <Input
            label="Transaction Date (dd/mm/yyyy) *"
            type="date"
            name="transaction_date"
            value={txDraft.transaction_date}
            onChange={onDraftChange}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Receipt*</label>
            <MileageReceiptsInput
              files={txDraft.receipts}
              onChange={(files) => setTxDraft((prev) => ({ ...prev, receipts: files }))}
              buttonLabel="Upload a file"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <div className="text-sm text-gray-500">
            Draft total: <b>${totalAmount.toFixed(2)}</b>
          </div>
          <Button
            type="button"
            label="Add mileage"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={addMileage}
          />
        </div>
      </div>

      {/* Mileage detail table */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">Mileage detail</h4>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Travel details (from → to)</th>
                <th className="text-left p-3">Period (from → to)</th>
                <th className="text-left p-3">Total Amount</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(mileageData.transactions || []).length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={4}>
                    No mileage added yet.
                  </td>
                </tr>
              ) : (
                mileageData.transactions.map((tx, idx) => {
                  const rowTotal =
                    Number(tx.meter_km || 0) + Number(tx.parking_amount || 0);

                  return (
                    <tr key={idx} className="border-t">
                      <td className="p-3">
                        {mileageData.travel_from || "-"} → {mileageData.travel_to || "-"}
                      </td>
                      <td className="p-3">
                        {mileageData.period_of_from || "-"} → {mileageData.period_of_to || "-"}
                      </td>
                      <td className="p-3">${rowTotal.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          className="text-red-500 hover:underline"
                          onClick={() => removeRow(idx)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
