import { notFound, redirect } from 'next/navigation';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import getListingById from '@/app/(marketplace)/actions/getListingById';
import EditListingClient from './EditListingClient';

interface EditListingPageProps {
  params: {
    listingId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function EditListingPage({ params }: EditListingPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/');
  }

  const listing = await getListingById({ listingId: params.listingId });
  if (!listing) {
    notFound();
  }

  const canEdit =
    listing.userId === currentUser.id ||
    currentUser.role === 'moder' ||
    currentUser.role === 'admin';

  if (!canEdit) {
    redirect('/my-listings');
  }

  return <EditListingClient currentUser={currentUser} listing={listing} />;
}
