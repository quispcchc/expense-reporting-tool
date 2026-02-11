import React from "react";
import Input from '../../common/ui/Input.jsx';

export default function MileageHeaderForm({ mileageData, setMileageData }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMileageData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
      <Input
        label="Travel From"
        name="travel_from"
        value={mileageData.travel_from}
        onChange={handleChange}
      />

      <Input
        label="Travel To"
        name="travel_to"
        value={mileageData.travel_to}
        onChange={handleChange}
      />

      <Input
        label="Period From"
        name="period_of_from"
        type="date"
        value={mileageData.period_of_from}
        onChange={handleChange}
      />

      <Input
        label="Period To"
        name="period_of_to"
        type="date"
        value={mileageData.period_of_to}
        onChange={handleChange}
      />
    </div>
  );
}
