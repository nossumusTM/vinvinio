'use client';

import qs, { type StringifiableRecord } from 'query-string';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { IconType } from 'react-icons';
import { LuSparkles } from 'react-icons/lu';

interface CategoryBoxProps {
  icon: IconType;
  label: string;
  description: string;
  selected?: boolean;
  bookingCount?: number;
  isTrending?: boolean;
  pinned?: boolean;
}

/**
 * PURE UI + routing logic — only rendered on the client after mount.
 */
const CategoryBoxInner: React.FC<CategoryBoxProps> = ({
  icon: Icon,
  label,
  description,
  selected,
  bookingCount = 0,
  isTrending = false,
  pinned = false,
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

  const bookingsLabel =
    bookingCount > 0
      ? `${bookingCount} booking${bookingCount === 1 ? '' : 's'}`
      : null;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      title={description}
      className={clsx(
        'relative flex h-[110px] w-[110px] shrink-0 flex-col items-center justify-center rounded-2xl bg-white p-4 text-neutral-600 shadow-md transition-all duration-300',
        selected
          ? 'text-neutral-900 shadow-xl shadow-neutral-400/60'
          : 'hover:shadow-lg hover:shadow-neutral-300/50'
      )}
    >
      {pinned && (
        <motion.span
          initial={{ opacity: 0, y: -6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute right-2 top-2 inline-flex items-center justify-center gap-0 rounded-full bg-[#2200ffff] px-1 py-0.5 text-[8px] font-normal uppercase tracking-tight text-white shadow-md shadow-blue-200/70"
          aria-label="Pinned category"
        >
          {/* <LuSparkles className="h-2 w-2" aria-hidden="true" /> */}
          <span>Hotspot</span>
        </motion.span>
      )}

      {bookingCount > 0 && (
        <div className="absolute right-2 top-2 flex items-center gap-2" aria-hidden="true">
          {isTrending && (
            <motion.span
              initial={{ opacity: 0, y: -6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
                repeat: 0,
              }}
              className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-[#2200ffff] shadow-sm"
            >
              Trending
            </motion.span>
          )}
          <span className="h-2.5 w-2.5 rounded-full bg-[#2200ffff]" />
        </div>
      )}

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
          'flex h-12 w-12 items-center justify-center rounded-full bg-transparent shadow-md shadow-neutral-300/40',
          selected && 'shadow-neutral-400/60',
          pinned && 'shadow-blue-300/60'
        )}
        aria-hidden="true"
      >
        <Icon
          className={clsx('h-7 w-7', selected ? 'text-neutral-900' : 'text-neutral-600')}
          aria-hidden="true"
        />
      </motion.div>

      {/* fixed-height label area so long titles don't resize the tile */}
      <span
        className="mt-4 block h-10 w-full px-1 text-center text-[8px] font-semibold uppercase leading-tight tracking-wide text-neutral-700 line-clamp-2 overflow-hidden"
      >
        {label}
      </span>

      {/* booking count, added under the label; styling above untouched */}
      {bookingsLabel && (
        <span className="text-[8px] font-medium text-neutral-500 border-b">
          {bookingsLabel}
        </span>
      )}
    </button>
  );
};

/**
 * Shell:
 * - No router / searchParams / framer-motion / anything fancy.
 * - Renders nothing during SSR + initial hydration.
 * - After first client mount, it renders the real interactive box.
 *
 * That makes CategoryBox itself hydration-safe inside any Suspense boundary.
 */
const CategoryBox: React.FC<CategoryBoxProps> = (props) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <CategoryBoxInner {...props} />;
};

export default CategoryBox;
