'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

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
        <div className="bg-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all">
            <select
            id="sort"
            value={sort}
            onChange={handleFilterChange}
            className="bg-transparent text-md font-semibold text-neutral-700 outline-none"
            >
            <option value="">Sort By: Initial</option>
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
