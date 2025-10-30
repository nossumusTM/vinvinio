'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { PiSortDescending } from "react-icons/pi";
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { RxCross2 } from 'react-icons/rx';

export type GridSize = 2 | 4 | 6;

interface ListingFilterProps {
  gridSize: GridSize;
  onGridChange: (size: GridSize) => void;
}

const GridIcon = ({ columns }: { columns: GridSize }) => {
  if (columns === 2) {
    return (
      <div className="flex items-center gap-[3px]">
        {[0, 1].map((index) => (
          <span
            key={index}
            className="h-[14px] w-3 rounded-[3px] bg-neutral-500"
          />
        ))}
      </div>
    );
  }

  const config = columns === 4 ? { cols: 2, rows: 2 } : { cols: 3, rows: 2 };
  const totalCells = config.cols * config.rows;

  return (
    <div
      className={twMerge(
        'grid gap-[2px]',
        config.cols === 2 ? 'grid-cols-2' : 'grid-cols-3'
      )}
    >
      {Array.from({ length: totalCells }).map((_, index) => (
        <span
          key={index}
          className="h-[9px] w-[9px] rounded-[2px] bg-neutral-500"
        />
      ))}
    </div>
  );
};

declare global {
  interface WindowEventMap {
    'categories:open': CustomEvent<void>;
  }
}

const ListingFilter = ({ gridSize, onGridChange }: ListingFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState('');
  const [visible, setVisible] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const sortButtonRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const gridButtonRef = useRef<HTMLDivElement>(null);
  const gridDropdownRef = useRef<HTMLDivElement>(null);
  const [sortDropdownCoords, setSortDropdownCoords] = useState({
    left: 0,
    top: 0,
    width: 0,
  });
  const [gridDropdownCoords, setGridDropdownCoords] = useState({
    left: 0,
    top: 0,
    width: 0,
  });

  const category = searchParams?.get('category') || '';

  const gridOptions: { value: GridSize; label: string }[] = [
    { value: 2, label: '2 per row' },
    { value: 4, label: '4 per row' },
    { value: 6, label: '6 per row' },
  ];

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node) &&
        !sortButtonRef.current?.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }

      if (
        gridDropdownRef.current &&
        !gridDropdownRef.current.contains(event.target as Node) &&
        !gridButtonRef.current?.contains(event.target as Node)
      ) {
        setIsGridOpen(false);
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
    <div
      className={`transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative inline-block">
          <div
            ref={gridButtonRef}
            onClick={() => {
              if (gridButtonRef.current) {
                const rect = gridButtonRef.current.getBoundingClientRect();
                setGridDropdownCoords({
                  left: rect.left + window.scrollX,
                  top: rect.bottom + window.scrollY + 8,
                  width: rect.width,
                });
              }

              setIsGridOpen((prev) => !prev);
              setIsSortOpen(false);
            }}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md hover:shadow-lg cursor-pointer font-medium text-neutral-700 text-sm"
          >
            <GridIcon columns={gridSize} />
            Make Grid
          </div>

          <AnimatePresence>
            {isGridOpen && (
              <motion.div
                ref={gridDropdownRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-lg"
                style={{
                  left: gridDropdownCoords.left,
                  top: gridDropdownCoords.top,
                  minWidth: Math.max(gridDropdownCoords.width, 160),
                }}
              >
                {gridOptions.map((option, index) => {
                  const isActive = gridSize === option.value;

                  return (
                    <div
                      key={option.value}
                      onClick={() => {
                        onGridChange(option.value);
                        setIsGridOpen(false);
                      }}
                      className={twMerge(
                        'px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100 transition cursor-pointer flex items-center gap-3',
                        isActive && 'font-semibold bg-neutral-100',
                        index === gridOptions.length - 1 && 'rounded-b-xl',
                        index === 0 && 'rounded-t-xl'
                      )}
                    >
                      <GridIcon columns={option.value} />
                      {option.label}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative inline-block">
          <div
            ref={sortButtonRef}
            onClick={() => {
              if (sortButtonRef.current) {
                const rect = sortButtonRef.current.getBoundingClientRect();
                setSortDropdownCoords({
                  left: rect.left + window.scrollX,
                  top: rect.bottom + window.scrollY + 8,
                  width: rect.width,
                });
              }

              setIsSortOpen((prev) => !prev);
              setIsGridOpen(false);
            }}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md hover:shadow-lg cursor-pointer font-medium text-neutral-700 text-sm"
          >
          {/* {sort ? filterOptions.find(o => o.value === sort)?.label : <div className="flex flex-row justify-center items-center gap-2 w-50"> <PiSortDescending /> Sort By </div>} */}
          <div className="flex flex-row justify-center items-center gap-2 w-70 select-none">
            <PiSortDescending />
            {filterOptions.find(o => o.value === sort)?.label || 'Make By'}
          </div>

        </div>

        <AnimatePresence>
          {isSortOpen && (
              <motion.div
                ref={sortDropdownRef}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-lg w-max"
                style={{
                  left: sortDropdownCoords.left,
                  top: sortDropdownCoords.top,
                  minWidth: Math.max(sortDropdownCoords.width, 160),
                }}
              >

              {filterOptions.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => {
                    const isSameOption = sort === option.value;
                    const newSort = isSameOption ? '' : option.value;
                  
                    setSort(newSort);
                    setIsSortOpen(false);

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

        {category && (
          <button
            type="button"
            onClick={handleClearCategory}
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-full shadow-md hover:shadow-lg cursor-pointer text-left"
          >
            <RxCross2 className="text-neutral-500" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">
                Selected Category
              </span>
              <span className="max-w-[180px] truncate text-sm font-medium text-neutral-700">
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
