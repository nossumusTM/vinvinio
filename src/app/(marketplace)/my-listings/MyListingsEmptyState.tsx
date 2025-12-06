'use client';

import { useRouter } from 'next/navigation';

import Button from '@/app/(marketplace)/components/Button';
import Heading from '@/app/(marketplace)/components/Heading';

const MyListingsEmptyState = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-8 pt-24 mt-14 md:mt-24">
      <Heading
        center
        title="No listings yet"
        subtitle="Create your first experience to see it listed here."
      />

      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl transition hover:shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Ready to host?
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Launch your first experience</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Set up your partner profile and publish an experience to start welcoming guests.
                You can edit or pause your listing at any time.
              </p>
            </div>
            <div className="w-full md:w-auto md:min-w-[220px]">
              <Button
                label="Go to partner landing"
                onClick={() => router.push('/landing-partner')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyListingsEmptyState;