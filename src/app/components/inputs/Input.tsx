// 'use client';

// import {
//     FieldErrors,
//     FieldValues,
//     UseFormRegister
// } from "react-hook-form";
// import { BiRupee } from "react-icons/bi";
// import { TbCurrencyEuro } from "react-icons/tb";

// interface InputProps {
//     id: string;
//     label: string;
//     type?: string;
//     disabled?: boolean;
//     formatPrice?: boolean;
//     required?: boolean;
//     register: UseFormRegister<FieldValues>,
//     errors: FieldErrors,
//     maxLength?: number,
//     textarea?: boolean;
//     inputClassName?: string;
// }

// const Input: React.FC<InputProps> = ({
//     id,
//     label,
//     type = "text",
//     disabled,
//     formatPrice,
//     register,
//     required,
//     errors,
//     textarea,
//     inputClassName
// }) => {
//     return (
//         <div className="w-full relative">
//             {formatPrice && (
//                 <TbCurrencyEuro
//                     size={24}
//                     className="
//             text-neutral-700
//             absolute
//             top-5
//             left-2
//           "
//                 />
//             )}
//             {textarea ? (
//                 <textarea
//                     id={id}
//                     disabled={disabled}
//                     {...register(id, { required })}
//                     placeholder=" "
//                     rows={6}
//                     className={`
//                     peer
//                     w-full
//                     p-4
//                     pt-6 
//                     font-light 
//                     bg-white 
//                     border-2
//                     rounded-md
//                     outline-none
//                     transition
//                     disabled:opacity-70
//                     disabled:cursor-not-allowed
//                     ${formatPrice ? 'pl-9' : 'pl-4'}
//                     ${errors[id] ? 'border-rose-500' : 'border-neutral-300'}
//                     ${errors[id] ? 'focus:border-rose-500' : 'focus:border-black'}
//                     ${inputClassName || ''}
//                     `}
//                 />
//                 ) : (
//                 <input
//                     id={id}
//                     disabled={disabled}
//                     {...register(id, { required })}
//                     placeholder=" "
//                     type={type}
//                     className={`
//                     peer
//                     w-full
//                     p-4
//                     pt-6 
//                     font-light 
//                     bg-white 
//                     border-2
//                     rounded-md
//                     outline-none
//                     transition
//                     disabled:opacity-70
//                     disabled:cursor-not-allowed
//                     ${formatPrice ? 'pl-9' : 'pl-4'}
//                     ${errors[id] ? 'border-rose-500' : 'border-neutral-300'}
//                     ${errors[id] ? 'focus:border-rose-500' : 'focus:border-black'}
//                     ${inputClassName || ''}
//                     `}
//                 />
//                 )}
//             <label
//                 className={`
//           absolute 
//           text-md
//           duration-150 
//           transform 
//           -translate-y-3 
//           top-5 
//           z-10 
//           origin-[0] 
//           ${formatPrice ? 'left-9' : 'left-4'}
//           peer-placeholder-shown:scale-100 
//           peer-placeholder-shown:translate-y-0 
//           peer-focus:scale-75
//           peer-focus:-translate-y-4
//           ${errors[id] ? 'text-rose-500' : 'text-zinc-400'}
//         `}
//             >
//                 {label}
//             </label>
//         </div>
//     );
// }

// export default Input;

'use client';

import {
  FieldErrors,
  FieldValues,
  UseFormRegister
} from "react-hook-form";
import { TbCurrencyEuro } from "react-icons/tb";

interface InputProps {
  id: string;
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
          {...register(id, { required })}
          placeholder=" "
          rows={6}
          className={`
            peer w-full px-4 pt-6 pb-2 text-base font-light bg-white border-2 rounded-md outline-none transition
            disabled:opacity-70 disabled:cursor-not-allowed
            ${formatPrice ? 'pl-9' : ''}
            ${errors[id] ? 'border-rose-500' : 'border-neutral-300'}
            ${errors[id] ? 'focus:border-rose-500' : 'focus:border-black'}
            ${inputClassName || ''}
          `}
        />
      ) : (
        <input
          id={id}
          disabled={disabled}
          {...register(id, { required })}
          placeholder=" "
          type={type}
          className={`
            peer w-full h-11 px-4 pt-[14px] pb-[2px] text-base font-light bg-white border-2 rounded-md outline-none transition
            disabled:opacity-70 disabled:cursor-not-allowed
            ${formatPrice ? 'pl-9' : ''}
            ${errors[id] ? 'border-rose-500' : 'border-neutral-300'}
            ${errors[id] ? 'focus:border-rose-500' : 'focus:border-black'}
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
            ${errors[id] ? 'text-rose-500' : 'text-zinc-400'}
          `}          
      >
        {label}
      </label>
    </div>
  );
};

export default Input;