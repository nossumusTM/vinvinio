import { redirect } from 'next/navigation';

import ClientOnly from '@/app/(marketplace)/components/ClientOnly';
import EmptyState from '@/app/(marketplace)/components/EmptyState';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import getListings from '@/app/(marketplace)/actions/getListings';

import MyListingsClient from './MyListingsClient';

const VALID_TABS = [
  'approved',
  'pending',
  'revision',
  'awaiting_reapproval',
  'inactive',
  'rejected',
] as const;

type TabKey = typeof VALID_TABS[number];

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'host') {
    redirect('/');
  }

  // Ensure we land with a canonical ?tab=
  const raw = typeof searchParams?.tab === 'string' ? searchParams.tab : null;
  const hasValidTab = raw && (VALID_TABS as readonly string[]).includes(raw);
  if (!hasValidTab) {
    const sp = new URLSearchParams();
    // keep any other params (except tab)
    for (const [k, v] of Object.entries(searchParams ?? {})) {
      if (k === 'tab') continue;
      if (Array.isArray(v)) v.forEach(x => sp.append(k, x));
      else if (typeof v === 'string') sp.set(k, v);
    }
    sp.set('tab', 'approved'); // default
    redirect(`/my-listings?${sp.toString()}`);
  }

  const activeTab = raw as TabKey;

  const listings = await getListings({
    userId: currentUser.id,
    statuses: ['pending', 'revision', 'awaiting_reapproval', 'approved', 'inactive', 'rejected'],
    take: 100,
  });

  if (listings.length === 0) {
    return (
      <ClientOnly>
        <EmptyState
          title="No listings yet"
          subtitle="Create your first experience to see it listed here."
        />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <MyListingsClient
        listings={listings}
        currentUser={currentUser}
        activeTab={activeTab}
      />
    </ClientOnly>
  );
}