import React from "react";

export default function MileageToggle({ value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        id="includeMileage"
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <label htmlFor="includeMileage" className="text-sm font-medium">
        Add Mileage
      </label>
    </div>
  );
}
