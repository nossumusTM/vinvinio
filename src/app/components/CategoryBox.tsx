'use client';

import qs from 'query-string';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CategoryBoxProps {
  icon: string;
  label: string;
  description: string;
  selected?: boolean;
}

const CategoryBox: React.FC<CategoryBoxProps> = ({
  icon,
  label,
  description,
  selected,
}) => {
  const router = useRouter();
  const params = useSearchParams();

  const handleClick = useCallback(() => {
    let currentQuery = {};

    if (params) {
      currentQuery = qs.parse(params.toString());
    }

    const updatedQuery: Record<string, unknown> = {
      ...currentQuery,
      category: label,
    };

    if (params?.get('category') === label) {
      delete updatedQuery.category;
    }

    const url = qs.stringifyUrl(
      {
        url: '/',
        query: updatedQuery,
      },
      { skipNull: true },
    );

    router.push(url);
  }, [label, router, params]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      title={description}
      className={clsx(
        'flex min-w-[120px] flex-col items-center justify-center gap-2.5 rounded-2xl border px-4 py-4 text-center transition-all duration-300',
        selected
          ? 'border-neutral-900 bg-neutral-900/5 text-neutral-900 shadow-lg shadow-neutral-200/80'
          : 'border-neutral-200 bg-white/70 text-neutral-600 hover:border-neutral-300 hover:bg-white',
      )}
    >
      <motion.div
        animate={
          selected
            ? {
                scale: [1, 1.08, 1],
                rotate: [0, -2, 2, 0],
              }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          duration: selected ? 1.6 : 0.4,
          repeat: selected ? Infinity : 0,
          ease: 'easeInOut',
        }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm"
        aria-hidden="true"
      >
        <Image
          src={icon}
          alt={label}
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
          priority={false}
        />
      </motion.div>
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </button>
  );
};

export default CategoryBox;

