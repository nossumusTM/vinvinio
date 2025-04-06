'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Loader from '@/app/components/Loader';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    referenceId: string;
  };
}

const ReferralLandingPage = ({ params }: PageProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trackReferral = async () => {
      const { referenceId } = params;

      if (referenceId) {
        localStorage.setItem('scannedReferenceId', referenceId);
        console.log("Local", localStorage);

        try {
          await axios.post('/api/analytics/increment-scan', { referenceId });
        } catch (err) {
          console.error('Failed to increment scan:', err);
        }
      }

      router.push('/');
    };

    trackReferral();
  }, [params, router]);

  return <Loader />;
};

export default ReferralLandingPage;