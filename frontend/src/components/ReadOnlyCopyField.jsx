import { useState } from "react";

export default function ReadOnlyCopyField({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md w-full">
      <div className="flex items-center rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm">
        <input
          type="text"
          value={value}
          readOnly
          className="flex-1 bg-transparent text-gray-700 text-sm outline-none cursor-default select-all"
        />
        <button
          onClick={handleCopy}
          className="ml-2 text-sm text-blue-600 hover:underline"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}