import React, { useRef } from "react";

export default function MileageReceiptsInput({ files = [], onChange, buttonLabel = "Upload a file" }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    onChange(selected);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border border-blue-500 text-blue-600 rounded-lg py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50"
      >
        {buttonLabel}
        <span className="text-base">☁️</span>
      </button>

      {files.length > 0 && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="truncate max-w-[220px]">{f.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-red-500 hover:underline"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
