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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [dropdownCoords, setDropdownCoords] = useState({ left: 0, top: 0 });
  const shiftLeft = (sort === 'random' || sort === 'rating' || sort === '') ? 25 : -6;

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);  

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
          onClick={() => {
            if (buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              setDropdownCoords({
                left: rect.left + rect.width / 2,
                top: rect.bottom + window.scrollY + 8,
              });
            }
          
            setIsOpen(prev => !prev);
          }}
          
          className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md hover:shadow-lg cursor-pointer font-medium text-neutral-700"
        >
          {sort ? filterOptions.find(o => o.value === sort)?.label : <div className="flex flex-row justify-center items-center gap-2 w-50"> <PiSortDescending /> Sort By </div>}
        </div>
  
        <AnimatePresence>
          {isOpen && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-lg w-max min-w-[160px]"
                style={{
                  left: 0 - shiftLeft,
                  top: 50,
                }}
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
                    if (isSameOption) {
                      params.delete('sort');
                    } else {
                      params.set('sort', option.value);
                    }
                  
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
