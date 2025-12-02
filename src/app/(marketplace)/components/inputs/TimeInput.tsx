'use client';

import React from 'react';
import TimePicker from '../TimePicker';

interface NeumorphicTimeInputProps {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  helperText?: string;
  onChange: (value: string) => void;
}

const NeumorphicTimeInput: React.FC<NeumorphicTimeInputProps> = ({
  id,
  label,
  value,
  disabled,
  helperText,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
      >
        {label}
      </label>
      <div
        className={`rounded-2xl border border-transparent bg-neutral-100 px-3 py-2 shadow-[8px_8px_16px_rgba(0,0,0,0.06),-8px_-8px_16px_rgba(255,255,255,0.95)] transition-all duration-300
          ${disabled ? 'opacity-70' : 'hover:shadow-[10px_10px_20px_rgba(0,0,0,0.08),-10px_-10px_20px_rgba(255,255,255,0.9)] focus-within:shadow-[10px_10px_20px_rgba(0,0,0,0.08),-10px_-10px_20px_rgba(255,255,255,0.9)]'}`}
      >
        <TimePicker
          value={value}
          onChange={onChange}
          placement="up"
          minuteStep={5}
        />
      </div>
      {helperText ? <p className="text-[11px] text-neutral-500">{helperText}</p> : null}
    </div>
  );
};

export default NeumorphicTimeInput;
