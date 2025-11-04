'use client';

import { useRouter } from 'next/navigation';

import ExperienceWizard from '@/app/(marketplace)/components/listings/ExperienceWizard';
import type { SafeListing, SafeUser } from '@/app/(marketplace)/types';

interface EditListingClientProps {
  currentUser: SafeUser;
  listing: SafeListing;
}

const EditListingClient: React.FC<EditListingClientProps> = ({ currentUser, listing }) => {
  const router = useRouter();

  return (
    <ExperienceWizard
      currentUser={currentUser}
      initialListing={listing}
      onCancel={() => router.push('/my-listings')}
      onCompleted={() => router.push('/my-listings')}
      headingOverride={{
        title: `Edit ${listing.title ?? 'your listing'}`,
        subtitle: 'Update details and submit changes for moderation review.',
      }}
    />
  );
};

export default EditListingClient;
