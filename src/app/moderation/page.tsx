'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Listing {
    id: string;
    title: string;
    description: string;
    status: string;
    guestCount: number;
    experienceHour: string;
    hostDescription: string;
    meetingPoint: string;
    languages: string[];
    locationType: string[];
    locationDescription: string;
    imageSrc: string[];
    user: {
      name: string;
      email: string;
    };
  }  

const ModerationPage = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const fetchListings = async () => {
    try {
      const res = await axios.get('/api/listings/pending');
      setListings(res.data);
    } catch (err) {
      toast.error("Couldn't fetch listings");
    }
  };

  const handleAction = async (listingId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      await axios.post(`/api/listings/${listingId}/${action}`);
      toast.success(`Listing ${action}d`);
      await fetchListings(); // refresh listings
    } catch (err) {
      toast.error(`Failed to ${action}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Pending Listings for Moderation</h1>

      {listings.length === 0 ? (
        <p className="text-neutral-500">No listings pending moderation.</p>
      ) : (
        <div className="space-y-6">
          {listings.map((listing) => (
            <div key={listing.id} className="border p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold">{listing.title}</h2>
            <p className="text-neutral-700">{listing.description}</p>
          
            <div className="text-sm text-neutral-500">
              <p><strong>Submitted by:</strong> {listing.user.name} ({listing.user.email})</p>
              <p><strong>Status:</strong> {listing.status}</p>
              <p><strong>Host Description:</strong> {listing.hostDescription}</p>
              <p><strong>Guest Capacity:</strong> {listing.guestCount}</p>
              <p><strong>Duration:</strong> {listing.experienceHour} hours</p>
              <p><strong>Meeting Point:</strong> {listing.meetingPoint}</p>
              <p><strong>Languages:</strong> {listing.languages?.join(', ')}</p>
              <p><strong>Location Types:</strong> {listing.locationType?.join(', ')}</p>
              <p><strong>Location Description:</strong> {listing.locationDescription}</p>
            </div>
          
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-4">
              {listing.imageSrc.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`media-${i}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
          
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => handleAction(listing.id, 'approve')}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(listing.id, 'reject')}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>          
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerationPage;