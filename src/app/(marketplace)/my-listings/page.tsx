import { redirect } from 'next/navigation';

import ClientOnly from '@/app/(marketplace)/components/ClientOnly';
import EmptyState from '@/app/(marketplace)/components/EmptyState';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import getListings from '@/app/(marketplace)/actions/getListings';

import MyListingsClient from './MyListingsClient';

const MyListingsPage = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'host') {
    redirect('/');
  }

  const listings = await getListings({
    userId: currentUser.id,
    statuses: ['pending', 'revision', 'awaiting_reapproval', 'approved', 'inactive'],
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
      <MyListingsClient listings={listings} currentUser={currentUser} />
    </ClientOnly>
  );
};

export default MyListingsPage;
