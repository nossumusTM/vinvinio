'use client';

import React from 'react';

type ListingCardSkeletonProps = {
  compact?: boolean;
};

const ListingCardSkeleton: React.FC<ListingCardSkeletonProps> = ({ compact = false }) => {
  const mediaHeight = compact ? 210 : 420;

  return (
    <div
      className={`col-span-1 animate-pulse cursor-default rounded-2xl border border-neutral-200 bg-white shadow-md
                  ${compact ? 'p-4' : 'p-10'}`}
    >
      <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2'} w-full`}>
        {/* Media placeholder */}
        <div
          className="w-full relative rounded-xl overflow-hidden bg-neutral-200"
          style={{ height: mediaHeight }}
        />

        {/* Rating / meta row */}
        <div className="pt-2 flex items-center gap-2 text-sm">
          <div className="h-3 w-16 bg-neutral-200 rounded" />
          <div className="h-3 w-10 bg-neutral-200 rounded" />
        </div>

        {/* Category + location chips */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <div className="h-5 w-20 bg-neutral-200 rounded-full" />
          <div className="h-5 w-36 bg-neutral-200 rounded-full" />
        </div>

        {/* Title */}
        <div className={`px-1 ${compact ? 'h-4 w-3/4' : 'h-5 w-2/3'} bg-neutral-200 rounded`} />

        <hr className="my-2" />

        {/* Price row */}
        <div className={`flex flex-row items-center gap-2 ${compact ? 'ml-2 mt-1' : 'ml-3 mt-1'}`}>
          <div className="h-4 w-16 bg-neutral-200 rounded" />
          <div className="h-3 w-20 bg-neutral-200 rounded" />
        </div>
      </div>
    </div>
  );
};

export default ListingCardSkeleton;
