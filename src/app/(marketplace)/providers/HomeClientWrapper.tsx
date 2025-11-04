'use client';

import { useEffect, useState } from 'react';
import HomeClient from '@/app/(marketplace)/components/HomeClient';
import Loader from '../components/Loader';
import getListings from '@/app/(marketplace)/actions/getListings';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

const HomeClientWrapper = () => {
  const [listings, setListings] = useState<any[] | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [listingsData, user] = await Promise.all([
        getListings({ take: 12 }),
        getCurrentUser(),
      ]);
      setListings(listingsData);
      setCurrentUser(user);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading || listings === null) {
    return <div className="pt-40"><Loader /></div>;
  }

  return <HomeClient initialListings={listings} currentUser={currentUser} />;
};

export default HomeClientWrapper;