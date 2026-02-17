import React from "react";
import ComponentContainer from "../../common/ui/ComponentContainer.jsx";
import MileageHeaderForm from "./MileageHeaderForm.jsx";
import MileageTransactions from './MileageTransactions.jsx';

export default function MileageSection({ mileageData, setMileageData, totalAmount }) {
  return (
    <ComponentContainer title="Mileage">
      <div className="bg-blue-100 rounded-t-xl px-6 py-4 flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-gray-800">Add mileage</h4>
          <p className="text-sm text-gray-500">
            Fill mileage details only if you travelled for this claim.
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600">Total amount</p>
          <p className="text-blue-600 font-semibold">${Number(totalAmount || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="p-6 bg-white rounded-b-xl">      
          <MileageHeaderForm mileageData={mileageData} setMileageData={setMileageData} />
          <MileageTransactions mileageData={mileageData} setMileageData={setMileageData} />
      </div>    
    </ComponentContainer>
  );
}
