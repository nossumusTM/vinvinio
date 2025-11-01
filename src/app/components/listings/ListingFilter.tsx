// 'use client';

// import { useRouter, useSearchParams } from 'next/navigation';
// import { useState, useEffect, useRef } from 'react';
// import { PiSortDescending } from "react-icons/pi";
// import { motion, AnimatePresence } from 'framer-motion';
// import { twMerge } from 'tailwind-merge';
// import { RxCross2 } from 'react-icons/rx';

// declare global {
//   interface WindowEventMap {
//     'categories:open': CustomEvent<void>;
//   }
// }

// const ListingFilter = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [sort, setSort] = useState('');
//   const [visible, setVisible] = useState(true);
//   const [isOpen, setIsOpen] = useState(false);
//   const buttonRef = useRef<HTMLDivElement>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const category = searchParams?.get('category') || '';

//   const [, setDropdownCoords] = useState({ left: 0, top: 0 });
//   const shiftLeft = (sort === 'random' || sort === 'rating' || sort === '') ? 25 : -6;

//   const filterOptions = [
//     { value: 'rating', label: 'Review' },
//     { value: 'priceLow', label: 'Price: Low to High' },
//     { value: 'priceHigh', label: 'Price: High to Low' },
//     { value: 'random', label: 'Random' },
//   ];

//   useEffect(() => {
//     if (searchParams) {
//       setSort(searchParams.get('sort') || '');
//     }
//   }, [searchParams]);

//   const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selected = e.target.value;
//     setSort(selected);

//     if (!searchParams) return;

//     const params = new URLSearchParams(searchParams.toString());
//     params.set('sort', selected);

//     router.push(`/?${params.toString()}`);
//   };

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node) &&
//         !buttonRef.current?.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };
  
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);  

//   // Scroll-based visibility
//   useEffect(() => {
//     let lastScroll = window.scrollY;

//     const handleScroll = () => {
//       const currentScroll = window.scrollY;
//       setVisible(currentScroll < lastScroll || currentScroll < 100);
//       lastScroll = currentScroll;
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   const handleClearCategory = () => {
//     const params = new URLSearchParams(searchParams?.toString() || '');
//     params.delete('category');

//     const query = params.toString();

//     router.push(query ? `/?${query}` : '/');

//     if (typeof window !== 'undefined') {
//       window.dispatchEvent(new CustomEvent('categories:open'));
//     }
//   };

//   return (
//     <div
//       className={`transition-opacity duration-300 ${
//         visible ? 'opacity-100' : 'opacity-0'
//       }`}
//     >
//       <div className="flex items-center gap-3">
//         <div className="relative inline-block">
//           <div
//             ref={buttonRef}
//             onClick={() => {
//               if (buttonRef.current) {
//                 const rect = buttonRef.current.getBoundingClientRect();
//                 setDropdownCoords({
//                   left: rect.left + rect.width / 2,
//                   top: rect.bottom + window.scrollY + 8,
//                 });
//               }

//               setIsOpen(prev => !prev);
//             }}
//             className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md hover:shadow-lg transition cursor-pointer font-medium text-neutral-700 text-sm"
//           >
//           {/* {sort ? filterOptions.find(o => o.value === sort)?.label : <div className="flex flex-row justify-center items-center gap-2 w-50"> <PiSortDescending /> Sort By </div>} */}
//           <div className="flex flex-row justify-center items-center gap-2 w-70 select-none">
//             <PiSortDescending />
//             {filterOptions.find(o => o.value === sort)?.label || 'Make By'}
//           </div>

//         </div>

//         <AnimatePresence>
//           {isOpen && (
//               <motion.div
//                 ref={dropdownRef}
//                 initial={{ opacity: 0, y: -8 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -8 }}
//                 transition={{ duration: 0.15 }}
//                 className="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-lg w-max min-w-[160px]"
//                 style={{
//                   left: 0 - shiftLeft,
//                   top: 50,
//                 }}
//               >            
                     
//               {filterOptions.map((option, index) => (
//                 <div
//                   key={option.value}
//                   onClick={() => {
//                     const isSameOption = sort === option.value;
//                     const newSort = isSameOption ? '' : option.value;
                  
//                     setSort(newSort);
//                     setIsOpen(false);
                  
//                     const params = new URLSearchParams(searchParams?.toString() || '');
//                     if (isSameOption) {
//                       params.delete('sort');
//                     } else {
//                       params.set('sort', option.value);
//                     }
                  
//                     router.push(`/?${params.toString()}`);
//                   }}                  
//                   className={twMerge(
//                     "px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100 transition cursor-pointer",
//                     sort === option.value && "font-semibold bg-neutral-100",
//                     index === filterOptions.length - 1 && "rounded-b-xl"
//                   )}
//                 >
//                   {option.label}
//                 </div>
//               ))}

//             </motion.div>
//           )}
//         </AnimatePresence>
//         </div>

//         {category && (
//           <button
//             type="button"
//             onClick={handleClearCategory}
//             className="flex items-center gap-2 bg-white py-1.5 px-4 rounded-full shadow-md hover:shadow-lg transition cursor-pointer text-left"
//           >
//             <RxCross2 className="text-neutral-500" />
//             <div className="flex flex-col leading-tight">
//               <span className="text-[5px] uppercase tracking-wide text-black font-semibold">
//                 Selected Category
//               </span>
//               <span className="max-w-[180px] truncate text-xs font-medium text-neutral-700">
//                 {category}
//               </span>
//             </div>
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ListingFilter;

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { PiSortDescending } from "react-icons/pi";
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { RxCross2 } from 'react-icons/rx';
import { PiSquaresFour } from "react-icons/pi";

export type GridSize = 1 | 2 | 4 | 6; // 👈 include 1

declare global {
  interface WindowEventMap {
    'categories:open': CustomEvent<void>;
  }
}

interface ListingFilterProps {
  gridSize: GridSize;
  onGridChange: (size: GridSize) => void;
}

const ListingFilter: React.FC<ListingFilterProps> = ({ gridSize, onGridChange }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sort, setSort] = useState('');
  const [visible, setVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const category = searchParams?.get('category') || '';

  // you kept these in state previously; dropdownCoords not actually needed since you position fixed
  const shiftLeft = (sort === 'random' || sort === 'rating' || sort === '') ? 25 : -6;

  const filterOptions = [
    { value: 'rating', label: 'Review' },
    { value: 'priceLow', label: 'Price: Low to High' },
    { value: 'priceHigh', label: 'Price: High to Low' },
    { value: 'random', label: 'Random' },
  ] as const;

  useEffect(() => {
    if (searchParams) {
      setSort(searchParams.get('sort') || '');
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let lastScroll = window.scrollY;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setVisible(currentScroll < lastScroll || currentScroll < 100);
      lastScroll = currentScroll;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClearCategory = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('category');
    const query = params.toString();
    router.push(query ? `/?${query}` : '/');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('categories:open'));
    }
  };

  return (
    <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center gap-3">
        {/* SORT DROPDOWN */}
        <div className="relative inline-block">
          <div
            ref={buttonRef}
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md hover:shadow-lg transition cursor-pointer font-normal text-neutral-700 text-sm select-none"
          >
            <PiSortDescending />
            <span className="whitespace-nowrap">
              {filterOptions.find(o => o.value === sort)?.label || 'Make By'}
            </span>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-lg w-max min-w-[200px]"
                style={{ left: -20 - shiftLeft, top: 50 }}
              >
                {filterOptions.map((option, index) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      const isSameOption = sort === option.value;
                      const newSort = isSameOption ? '' : option.value;
                      setSort(newSort);
                      setIsOpen(false);
                      const params = new URLSearchParams(searchParams?.toString() || '');
                      if (isSameOption) params.delete('sort');
                      else params.set('sort', option.value);
                      router.push(`/?${params.toString()}`);
                    }}
                    className={twMerge(
                      "px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100 transition cursor-pointer",
                      sort === option.value && "font-semibold bg-neutral-100",
                      index === filterOptions.length - 1 && "rounded-b-xl"
                    )}
                  >
                    {option.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GRID TOGGLE — MOBILE (Grid 1 / Grid 2) */}
        {/* <div className="flex md:hidden items-center gap-2 bg-white py-1.5 px-2 rounded-full shadow-md">
          {[1, 2].map(size => (
            <button
              key={size}
              type="button"
              onClick={() => onGridChange(size as GridSize)}
              className={twMerge(
                "text-xs px-2 py-1 rounded-full transition flex items-center gap-1",
                gridSize === size
                  ? "bg-black text-white"
                  : "bg-transparent text-neutral-700 hover:bg-neutral-100"
              )}
              aria-label={`Grid ${size}`}
            >
              <PiSquaresFour className="text-[14px]" />
              <span>{size}</span>
            </button>
          ))}
        </div> */}

        {/* GRID TOGGLE — DESKTOP/TABLET (Grid 2 / Grid 4 / Grid 6) */}
        <div className="hidden md:flex items-center gap-2 bg-white py-1.5 px-2 rounded-full shadow-md">
          {[2, 4, 6].map(size => (
            <button
              key={size}
              type="button"
              onClick={() => onGridChange(size as GridSize)}
              className={twMerge(
                "text-xs px-2 py-1 rounded-full transition flex items-center gap-1",
                gridSize === size
                  ? "border border-neutral-100 text-black"
                  : "bg-transparent text-neutral-700 hover:bg-neutral-100"
              )}
              aria-label={`${size}`}
            >
              <PiSquaresFour className="text-[14px]" />
              <span>{size}</span>
            </button>
          ))}
        </div>

        {/* CATEGORY PILL */}
        {category && (
          <button
            type="button"
            onClick={handleClearCategory}
            className="flex items-center gap-2 bg-white py-1.5 px-4 rounded-full shadow-md hover:shadow-lg transition cursor-pointer text-left"
          >
            <RxCross2 className="text-neutral-500" />
            <div className="flex flex-col leading-tight">
              <span className="text-[5px] uppercase tracking-wide text-black font-semibold">
                Selected Category
              </span>
              <span className="max-w-[180px] truncate text-xs font-medium text-neutral-700">
                {category}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ListingFilter;