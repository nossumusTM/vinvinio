'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect, useRef } from 'react';
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
  const hasActiveFilters = useMemo(() => {
    if (!searchParams) return false;
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of params.entries()) {
      if (!value) continue;
      if (key === 'sort' || key === 'skip' || key === 'take') continue;
      return true;
    }
    return false;
  }, [searchParams]);
  const hasActiveNonCategoryFilters = useMemo(() => {
    if (!searchParams) return false;
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of params.entries()) {
      if (!value) continue;
      if (key === 'sort' || key === 'skip' || key === 'take' || key === 'category') continue;
      return true;
    }
    return false;
  }, [searchParams]);

  // you kept these in state previously; dropdownCoords not actually needed since you position fixed
  const shiftLeft = (sort === 'random' || sort === 'rating' || sort === '') ? 25 : -6;

  const filterOptions = [
    { value: 'rating', label: 'Review' },
    { value: 'priceLow', label: 'Price: Low to High' },
    { value: 'priceHigh', label: 'Price: High to Low' },
    { value: 'random', label: 'Random (VIN first)' },
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

  const handleClearFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    const sortParam = params.get('sort');
    const nextParams = new URLSearchParams();
    if (sortParam) {
      nextParams.set('sort', sortParam);
    }
    const query = nextParams.toString();
    router.push(query ? `/?${query}` : '/');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('categories:open'));
    }
  };

  return (
    <div className={`transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex justify-center px-2 pb-2 pt-1">
      <div className="max-w-[calc(100vw-1.5rem)] overflow-x-auto overflow-y-hidden rounded-2xl p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex w-max items-center gap-3">
        {/* SORT DROPDOWN */}
        <div className="relative inline-block">
          <div
            ref={buttonRef}
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md transition cursor-pointer font-normal text-neutral-700 text-sm rounded-2xl select-none"
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
                style={{ left: -10 - shiftLeft, top: 60 }}
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

        {category && (
          <button
            type="button"
            onClick={handleClearCategory}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md transition cursor-pointer font-normal text-neutral-700 text-sm rounded-2xl"
          >
            <RxCross2 className="text-neutral-500" />
            <span className="whitespace-nowrap">Clear category</span>
          </button>
        )}

        {hasActiveFilters && (hasActiveNonCategoryFilters || !category) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md transition cursor-pointer font-normal text-neutral-700 text-sm rounded-2xl"
          >
            <RxCross2 className="text-neutral-500" />
            <span className="whitespace-nowrap">Clear filters</span>
          </button>
        )}

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
        {/* <div className="hidden md:flex items-center gap-2 bg-white py-1.5 px-2 rounded-full shadow-md">
          {[2, 4, 6].map(size => (
            <button
              key={size}
              type="button"
              onClick={() => onGridChange(size as GridSize)}
              className={twMerge(
                "text-xs px-2 py-1 rounded-full transition flex items-center gap-1",
                gridSize === size
                  ? "border border-neutral-100 text-black bg-neutral-100"
                  : "bg-transparent text-neutral-700 hover:bg-black hover:text-white"
              )}
              aria-label={`${size}`}
            >
              <PiSquaresFour className="text-[14px]" />
              <span>{size}</span>
            </button>
          ))}
        </div> */}

      </div>
      </div>
      </div>
    </div>
  );
};

export default ListingFilter;
