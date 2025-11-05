'use client';

import qs from 'query-string';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

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
    let currentQuery: qs.StringifiableRecord = {};
    
    if (params) {
    currentQuery = qs.parse(params.toString());
    }

    const updatedQuery: qs.StringifiableRecord = {
    ...currentQuery,
    category: params?.get('category') === label ? undefined : label,
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
    className={`
      flex
      min-w-[150px]
      h-[80px]
      flex-col
      items-center
      justify-center
      gap-2.5
      rounded-2xl
      px-4
      py-4
      mt-0
      mb-4
      text-center
      transition-all
      duration-300
      ${selected
        ? 'text-neutral-900 shadow-lg shadow-neutral-200/80'
        : 'text-neutral-600 hover:border-neutral-300 bg-neutral-10 hover:shadow-md'
      }
    `}
    title={description}
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
        className="flex h-10 w-10 items-center justify-center rounded-lg shadow-sm"
        aria-hidden="true"
      >
        <Image
          src={icon}
          alt={label}
          width={56}
          height={56}
          className="h-8 w-8 object-contain"
          priority={false}
        />
      </motion.div>
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </button>
  );
};

export default CategoryBox;
