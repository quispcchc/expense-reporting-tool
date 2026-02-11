import React from 'react';

export default function MileageReceiptInput({ files = [], onChange }) {
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    onChange(selected);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />

      {files.length > 0 && (
        <ul className="mt-2 text-sm text-gray-600">
          {files.map((file, idx) => (
            <li key={idx} className="flex justify-between items-center">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-red-500 text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
