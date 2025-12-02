'use client';

import React from 'react';

interface NeumorphicToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NeumorphicToggle: React.FC<NeumorphicToggleProps> = ({ id, label, checked, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`relative flex h-5 w-[36px] items-center rounded-full transition-all duration-300 ease-out
          ${checked
            ? 'bg-neutral-100 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.12),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]'
            : 'bg-neutral-100 shadow-[2px_2px_4px_rgba(0,0,0,0.12),-2px_-2px_4px_rgba(255,255,255,0.9)]'}
          peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-black
        `}
        aria-hidden="true"
      >
        <span
          className={`absolute left-1 h-4 w-4 rounded-full bg-neutral-100
            shadow-[2px_2px_4px_rgba(0,0,0,0.10),-2px_-2px_4px_rgba(255,255,255,0.75)] transition-transform duration-300 ease-out
            ${checked ? 'translate-x-[12px]' : 'translate-x-0'}`}
        />
      </span>
      <span className="text-sm font-medium text-neutral-800">{label}</span>
    </label>
  );
};

export default NeumorphicToggle;