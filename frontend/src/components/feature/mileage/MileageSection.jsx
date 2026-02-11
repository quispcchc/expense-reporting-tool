import React from "react";
import ComponentContainer from "../../common/ui/ComponentContainer.jsx";
import MileageHeaderForm from "./MileageHeaderForm.jsx";
import MileageTransactions from './MileageTransactions.jsx';

export default function MileageSection({ mileageData, setMileageData }) {
  return (
    <ComponentContainer title="Mileage">
      <p className="text-gray-400 text-sm mb-5">
        Fill mileage details only if you travelled for this claim.
      </p>

      <MileageHeaderForm mileageData={mileageData} setMileageData={setMileageData} />
      <MileageTransactions mileageData={mileageData} setMileageData={setMileageData} />
    </ComponentContainer>
  );
}
