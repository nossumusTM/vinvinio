'use client';

import {
  FieldErrors,
  FieldValues,
  UseFormRegister
} from "react-hook-form";
import { TbCurrencyEuro } from "react-icons/tb";

interface InputProps {
  id: string;
  name?: string;
  label: string;
  type?: string;
  disabled?: boolean;
  formatPrice?: boolean;
  required?: boolean;
  register: UseFormRegister<FieldValues>,
  errors: FieldErrors,
  maxLength?: number,
  textarea?: boolean;
  inputClassName?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  name,
  label,
  type = "text",
  disabled,
  formatPrice,
  register,
  required,
  errors,
  textarea,
  inputClassName
}) => {
  const fieldName = name ?? id;

  const resolveError = (path: string, bag: FieldErrors<FieldValues>): unknown => {
    return path.split('.').reduce<unknown>((acc, segment) => {
      if (acc === undefined || acc === null) return undefined;

      if (Array.isArray(acc)) {
        const index = Number(segment);
        return Number.isNaN(index) ? undefined : acc[index];
      }

      if (typeof acc === 'object') {
        return (acc as Record<string, unknown>)[segment];
      }

      return undefined;
    }, bag);
  };

  const fieldError = resolveError(fieldName, errors);
  const hasError = Boolean(fieldError);
  return (
    <div className="w-full relative">
      {formatPrice && (
        <TbCurrencyEuro
          size={20}
          className="text-neutral-700 absolute top-1/2 left-3 transform -translate-y-1/2"
        />
      )}

      {textarea ? (
        <textarea
          id={id}
          disabled={disabled}
          {...register(fieldName, { required })}
          placeholder=" "
          rows={6}
          className={`
            peer w-full px-4 pt-6 pb-2 text-base font-light bg-white shadow-md rounded-md outline-none transition
            disabled:opacity-70 disabled:cursor-not-allowed
            ${formatPrice ? 'pl-9' : ''}
            ${hasError ? 'border-rose-500' : 'border-neutral-300'}
            ${hasError ? 'focus:border-rose-500' : 'focus:border-black'}
            ${inputClassName || ''}
          `}
        />
      ) : (
        <input
          id={id}
          disabled={disabled}
          {...register(fieldName, { required })}
          placeholder=" "
          type={type}
          className={`
            peer w-full h-11 px-4 pt-[14px] pb-[2px] text-base font-light bg-white shadow-md rounded-md outline-none transition
            disabled:opacity-70 disabled:cursor-not-allowed
            ${formatPrice ? 'pl-9' : ''}
            ${hasError ? 'border-rose-500' : 'border-neutral-300'}
            ${hasError ? 'focus:border-rose-500' : 'focus:border-black'}
            ${inputClassName || ''}
          `}
        />
      )}

      <label
        htmlFor={id}
        className={`
            absolute text-sm transition-all duration-150 z-10 origin-[0]
            ${formatPrice ? 'left-9' : 'left-4'}
            top-1/2 -translate-y-1/2
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
            peer-focus:top-1 peer-focus:translate-y-0
            peer-focus:scale-90 peer-placeholder-shown:scale-100
            peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:translate-y-0
            peer-[&:not(:placeholder-shown)]:scale-90
            ${hasError ? 'text-rose-500' : 'text-zinc-400'}
          `}
      >
        {label}
      </label>
    </div>
  );
};

export default Input;