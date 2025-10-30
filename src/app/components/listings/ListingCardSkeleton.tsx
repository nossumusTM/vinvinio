'use client';

const ListingCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-200 aspect-square" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        <div className="h-4 w-2/4 rounded bg-neutral-200" />
        <div className="h-4 w-1/4 rounded bg-neutral-200" />
      </div>
    </div>
  );
};

export default ListingCardSkeleton;
