import { useEffect, useState } from "react";
import api from "../../../api/api.js";

export default function ClaimMileagePanel({ claimId }) {
  const [mileage, setMileage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claimId) return;

    const fetchMileage = async () => {
      setLoading(true);
      try {

        const res = await api.get(`/claims/${claimId}/mileage`);

        setMileage(res.data?.mileage ?? res.data ?? null);
      } catch (e) {
        setMileage(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMileage();
  }, [claimId]);

  if (loading) return <div>Loading mileage...</div>;
  if (!mileage) return <div className="text-gray-500">No mileage for this claim.</div>;

  return (
    <div>
      <h4 className="font-medium mb-2">Mileage</h4>

      <div className="text-sm">
        <div><b>From:</b> {mileage.travel_from}</div>
        <div><b>To:</b> {mileage.travel_to}</div>
        <div><b>Period:</b> {mileage.period_of_from} → {mileage.period_of_to}</div>
      </div>

      <div className="mt-4">
        <h5 className="font-medium mb-2">Transactions</h5>
        {(mileage.transactions ?? []).map((tx) => (
          <div key={tx.transaction_id} className="border rounded p-3 mb-2">
            <div>Date: {tx.transaction_date}</div>
            <div>Distance: {tx.distance_km} km</div>

            <div className="mt-2">
              Receipts:
              {(tx.receipts ?? []).length === 0 ? (
                <span className="text-gray-500"> none</span>
              ) : (
                <ul className="list-disc pl-5">
                  {tx.receipts.map((r) => (
                    <li key={r.receipt_id}>{r.file_name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
