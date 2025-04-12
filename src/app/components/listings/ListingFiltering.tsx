'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import { FaSort } from 'react-icons/fa';
import { PiSortDescending } from "react-icons/pi";

const ListingFilter = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState('');
  const [visible, setVisible] = useState(true);

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
        <div className="relative inline-flex items-center bg-white py-2 pl-3 pr-2 rounded-full shadow-lg hover:shadow-xl transition-all w-auto">
          <PiSortDescending className="ml-3 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700 pointer-events-none" />
          <select
            id="sort"
            value={sort}
            onChange={handleFilterChange}
            className="appearance-none bg-transparent text-md font-semibold text-neutral-700 pl-8 pr-4 py-1 outline-none"
          >
            <option value="">Filter by</option>
            <option value="rating">Rating</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="random">Random</option>
          </select>
        </div>
    </div>
  );
};

export default ListingFilter;
