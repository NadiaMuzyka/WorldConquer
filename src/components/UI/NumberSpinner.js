import React from "react";

export default function NumberSpinner({ label, min = 1, max = 10, value, onChange }) {
  // Animazione scale su hover/active
  const btnBase =
    "transition-transform duration-100 rounded-full px-3 py-1 text-2xl font-bold focus:outline-none select-none";
  const btnActive =
    "active:scale-95 hover:scale-110 hover:bg-cyan-700/30 text-cyan-400 bg-gray-800 border border-gray-700";
  const btnDisabled =
    "opacity-40 cursor-not-allowed bg-gray-700 text-gray-400";

  return (
    <div className="flex flex-col items-center">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      )}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={`${btnBase} ${value <= min ? btnDisabled : btnActive}`}
          disabled={value <= min}
          aria-label="Decrement"
          onClick={() => onChange(value - 1)}
        >
          -
        </button>
        <div className="text-4xl font-bold text-cyan-400 mb-4 min-w-[3ch] text-center">
          {value}
        </div>
        <button
          type="button"
          className={`${btnBase} ${value >= max ? btnDisabled : btnActive}`}
          disabled={value >= max}
          aria-label="Increment"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
