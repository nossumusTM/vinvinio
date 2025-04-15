'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SafeUser } from '@/app/types';
import { useRouter } from 'next/navigation';

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

interface ModerationClientProps {
  currentUser: SafeUser | null;
}

const ModerationClient: React.FC<ModerationClientProps> = ({ currentUser }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const router = useRouter();

  const [selectedReservationId, setSelectedReservationId] = useState('');

  const fetchListings = async () => {
    try {
      const res = await axios.get('/api/listings/pending');
      setListings(res.data);
    } catch {
      toast.error("Couldn't fetch listings");
    }
  };

  const handleApprove = async (listingId: string) => {
    setIsLoading(true);
    try {
      await axios.post(`/api/listings/${listingId}/approve`);
      toast.success('Listing approved');
      fetchListings();
    } catch (error: any) {
      console.error('❌ Approve error:', error);
      toast.error(error?.response?.data || 'Failed to approve');
    } finally {
      setIsLoading(false);
    }
  };  

  const handleReject = async (listingId: string) => {
    setIsLoading(true);
    try {
      await axios.post(`/api/listings/${listingId}/reject`);
      toast.success('Listing rejected');
      fetchListings();
    } catch (error: any) {
      console.error('Reject failed:', error);
      toast.error('Failed to reject');
    } finally {
      setIsLoading(false);
    }
  };  

  const handleWithdraw = async () => {
    if (!targetUserId) return alert('Please provide a promoter userId');
    try {
      const res = await axios.post('/api/analytics/withdraw', { userId: targetUserId });
      toast.success(res.data.message, {
        iconTheme: { primary: '#08e2ff', secondary: '#fff' },
      });
      setTargetUserId('');
    } catch {
      toast.error('Failed to withdraw for this promoter.');
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const onCancel = async (id: string) => {
    if (!id) return toast.error('Reservation ID required');
    try {
      await axios.delete(`/api/reservations/${id}`);
      toast.success('Reservation cancelled', {
        iconTheme: { primary: '#08e2ff', secondary: '#fff' },
      });
      setSelectedReservationId('');
      router.refresh(); // optional if needed
    } catch {
      toast.error('Failed to cancel reservation');
    }
  };  

  if (!currentUser || currentUser.role !== 'moder') {
    return <p className="text-center text-neutral-500 py-10">Unauthorized or loading...</p>;
  }

  return (
    <div className="px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
      {/* Listings */}
      <div className="lg:col-span-8 space-y-6">
        <h1 className="text-2xl font-semibold mb-4">Pending Listings for Moderation</h1>
        {listings.length === 0 ? (
          <p className="text-neutral-500">No listings pending moderation.</p>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="border p-6 rounded-xl shadow-lg space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {listing.imageSrc.map((src, i) => (
                  <img key={i} src={src} alt={`media-${i}`} className="w-full h-40 object-cover rounded-lg" />
                ))}
              </div>
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
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleApprove(listing.id)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(listing.id)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="lg:col-span-4 space-y-6">
        {/* Withdraw */}
        <div className="shadow-lg p-6 rounded-xl bg-white">
            <h2 className="text-lg font-semibold mb-4">Withdraw for Promoter</h2>
            <input
            type="text"
            placeholder="Enter promoter userId"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="border p-2 rounded-lg w-full mb-3"
            />
            <button
            onClick={handleWithdraw}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition"
            >
            Withdraw
            </button>
        </div>

        {/* Cancel Reservation */}
        <div className="shadow-lg p-6 rounded-xl bg-white">
            <h3 className="text-md font-semibold mb-2">Moderator Cancellation Tool</h3>
            <input
            type="text"
            placeholder="Enter Reservation ID"
            value={selectedReservationId}
            onChange={(e) => setSelectedReservationId(e.target.value)}
            className="w-full border p-2 mb-2 rounded-lg"
            />
            <button
            onClick={() => onCancel(selectedReservationId)}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-neutral-800"
            >
            Cancel Reservation
            </button>
        </div>
        </div>
    </div>
  );
};

export default ModerationClient;