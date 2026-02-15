'use client';

import { useRouter } from 'next/navigation';

import ExperienceWizard from '@/app/(marketplace)/components/listings/ExperienceWizard';
import type { SafeUser } from '@/app/(marketplace)/types';

interface BecomePartnerClientProps {
  currentUser: SafeUser;
}

const BecomePartnerClient: React.FC<BecomePartnerClientProps> = ({ currentUser }) => {
  const router = useRouter();

  return (
    <ExperienceWizard
      currentUser={currentUser}
      onCancel={() => router.back()}
      onCompleted={() => router.push('/my-listings')}
      headingOverride={{
        title: 'Tell us about your service',
        subtitle: 'Share every detail so users can fall in love with what you offer.',
      }}
    />
  );
};

export default BecomePartnerClient;
