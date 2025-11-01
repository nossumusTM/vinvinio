'use client';

import qs from 'query-string';
import { useRouter, useSearchParams } from 'next/navigation';
import type { StringifiableRecord } from 'query-string';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { IconType } from 'react-icons';

interface CategoryBoxProps {
  icon: IconType;
  label: string;
  description: string;
  selected?: boolean;
}

const CategoryBox: React.FC<CategoryBoxProps> = ({
  icon: Icon,
  label,
  description,
  selected,
}) => {
  const router = useRouter();
  const params = useSearchParams();

  const handleClick = useCallback(() => {
    const currentQuery: StringifiableRecord = params
        ? (qs.parse(params.toString()) as StringifiableRecord)
        : {};

    // build with the category selected
    let nextQuery: StringifiableRecord = {
        ...currentQuery,
        category: label,
    };

    // if the same category is clicked, remove it immutably (no delete op)
    if (params?.get('category') === label) {
        const { category: _omit, ...rest } = nextQuery;
        nextQuery = rest;
    }

    const url = qs.stringifyUrl({ url: '/', query: nextQuery }, { skipNull: true });
    router.push(url);
  }, [label, router, params]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      title={description}
      className={clsx(
        'flex h-[110px] w-[110px] shrink-0 flex-col items-center justify-between rounded-xl border bg-white p-3 transition-all duration-300',
        selected
          ? 'border-neutral-400 text-neutral-900 shadow-lg shadow-neutral-300/60'
          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:shadow-md'
      )}
    >
      <motion.div
        animate={
          selected
            ? { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          duration: selected ? 1.6 : 0.4,
          repeat: selected ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className={clsx(
          'flex h-12 w-12 items-center justify-center rounded-lg border shadow-sm',
          selected ? 'border-neutral-400 bg-neutral-50' : 'border-neutral-200 bg-neutral-100'
        )}
        aria-hidden="true"
      >
        <Icon className="h-7 w-7 text-neutral-600" aria-hidden="true" />
      </motion.div>

      {/* fixed-height label area so long titles don't resize the tile */}
      <span
        className="mt-2 block h-10 w-full px-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-neutral-700 line-clamp-2 overflow-hidden"
      >
        {label}
      </span>
    </button>
  );
};

export default CategoryBox;
