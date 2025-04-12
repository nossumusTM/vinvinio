'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FiFilter } from 'react-icons/fi';
import { FaSort } from 'react-icons/fa';
import { PiSortDescending } from "react-icons/pi";
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const ListingFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState('');
  const [visible, setVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const filterOptions = [
    { value: 'rating', label: 'Review' },
    { value: 'priceLow', label: 'Price: Low to High' },
    { value: 'priceHigh', label: 'Price: High to Low' },
    { value: 'random', label: 'Random' },
  ];

  useEffect(() => {
    if (searchParams) {
      setSort(searchParams.get('sort') || '');
    }
  }, [searchParams]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setSort(selected);

    if (!searchParams) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', selected);

    router.push(`/?${params.toString()}`);
  };

  // Scroll-based visibility
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

  return (
    <div
      className={`transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative inline-block">
        <div
          ref={buttonRef}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md hover:shadow-lg cursor-pointer font-medium text-neutral-700"
        >
          {sort ? filterOptions.find(o => o.value === sort)?.label : 'FILTER BY'}
        </div>
  
        <AnimatePresence>
          {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-lg w-max min-w-[160px]"
                style={{
                  left: `${dropdownStyle.left - 35}px`,      // move it 5px to the left
                  top: `${dropdownStyle.top + 51}px`,        // add 8px vertical spacing
                  transform: 'translateX(-50%)',
                }}
              >            
                     
              {filterOptions.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setSort(option.value);
                    setIsOpen(false);

                    const params = new URLSearchParams(searchParams?.toString() || '');
                    params.set('sort', option.value);
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
    </div>
  );
};

export default ListingFilter;
