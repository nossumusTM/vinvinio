'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { SafeUser } from '@/app/types';
import { useRouter } from 'next/navigation';
import PlatformCard from '../components/PlatformCard';
import { AxiosError } from 'axios';

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

type DataEntry = {
  date: string;
  revenue: number;
  platformFee: number;
  bookingCount: number;
};

const ModerationClient: React.FC<ModerationClientProps> = ({ currentUser }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [platformData, setPlatformData] = useState<{
    daily: DataEntry[];
    monthly: DataEntry[];
    yearly: DataEntry[];
    totalRevenue: number;
  }>({
    daily: [],
    monthly: [],
    yearly: [],
    totalRevenue: 0,
  });
    
  const router = useRouter();

  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [hostLookup, setHostLookup] = useState('');
  const [promoterLookup, setPromoterLookup] = useState('');
  const [hostAnalytics, setHostAnalytics] = useState<any>(null);
  const [promoterAnalytics, setPromoterAnalytics] = useState<any>(null);


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
        iconTheme: { primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)', secondary: '#fff' },
      });
      setTargetUserId('');
    } catch {
      toast.error('Failed to withdraw for this promoter.');
    }
  };

  const handleWithdrawForHosts = async () => {
    if (!targetUserId) return alert('Please provide a host userId');
    try {
      const res = await axios.post('/api/analytics/host/withdraw', { userId: targetUserId });
      toast.success(res.data.message, {
        iconTheme: { primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)', secondary: '#fff' },
      });
      setTargetUserId('');
    } catch {
      toast.error('Failed to withdraw for this host.');
    }
  };  

  const handleHostAnalytics = async () => {
    try {
      const res = await axios.post('/api/analytics/host/get', { identifier: hostLookup });
      const payout = await axios.post('/api/users/get-payout-method', { identifier: res.data.userId });
  
      setHostAnalytics({
        totalBooks: res.data.totalBooks,
        totalRevenue: res.data.totalRevenue,
        payoutMethod: payout?.data?.method || 'None',
        payoutNumber: payout?.data?.number || '',
      });
    } catch (err) {
      toast.error('Host not found or error fetching data');
    }
  };
  
  const handlePromoterAnalytics = async () => {
    try {
      const res = await axios.post('/api/analytics/get', { identifier: promoterLookup });
      const payout = await axios.post('/api/users/get-payout-method', { userId: res.data.userId });
  
      setPromoterAnalytics({
        totalBooks: res.data.totalBooks,
        qrScans: res.data.qrScans,
        totalRevenue: res.data.totalRevenue,
        payoutMethod: payout?.data?.type || 'None',
      });
    } catch (err) {
      toast.error('Promoter not found or error fetching data');
    }
  };  

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('/api/analytics/platform');
      const platform = res.data;
  
      const normalize = (arr: any[]) =>
        arr.map((entry) => ({
          date: entry.date,
          revenue: Number(entry.revenue || 0),
          platformFee: Number(entry.platformFee || 0),
          bookingCount: Number(entry.bookingCount || 0),
        }));
  
      setPlatformData({
        daily: normalize(platform.daily),
        monthly: normalize(platform.monthly),
        yearly: normalize(platform.yearly),
        totalRevenue: res.data.totalRevenue,
      });
    };
  
    fetchData();
  }, []);  

  const onCancel = async (id: string) => {
    if (!id) return toast.error('Reservation ID required');
  
    try {
      setIsLoading(true);
  
      // 🔍 Fetch reservation to determine host and totalPrice
      const res = await axios.get(`/api/reservations/${id}`);
      const reservation = res.data;
      const referralId = reservation?.referralId;
      const totalPrice = reservation?.totalPrice ?? 0;
      const hostId = reservation?.listing?.userId;
  
      // ❌ Delete reservation
      await axios.delete(`/api/reservations/${id}`);
      toast.success('Reservation cancelled', {
        iconTheme: { primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)', secondary: '#fff' },
      });
  
      // 📉 Decrement referral analytics if referralId exists
      if (referralId) {
        await axios.post('/api/analytics/decreament', {
          reservationId: id,
          totalBooksIncrement: -1,
          totalRevenueIncrement: -totalPrice,
        });
      }
  
      // 📉 Decrement host analytics if hostId exists
      if (hostId && totalPrice) {
        await axios.post('/api/analytics/host/decrement', {
          hostId,
          totalPrice,
        });
      }
  
      setSelectedReservationId('');
      router.refresh();
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      toast.error(err.response?.data?.error || 'Cancellation failed.');
    } finally {
      setIsLoading(false);
    }
  };  

  if (!currentUser || currentUser.role !== 'moder') {
    return <p className="text-center text-neutral-500 py-10">Unauthorized or loading...</p>;
  }

  return (
    <>
    <div className="px-5 md:px-60 pt-2 md:pt-20 pb-10">
      <PlatformCard
          daily={platformData.daily}
          monthly={platformData.monthly}
          yearly={platformData.yearly}
          totalRevenue={platformData.totalRevenue}
        />
      </div>
      <div className="px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto rounded-3xl md:mt-10 h-[700px]">
      {/* Listings */}
      <div className="lg:col-span-8 space-y-6 max-h-[670px] overflow-y-auto pr-2">
        <h1 className="text-2xl font-semibold mb-4 ml-8">Pending Listings</h1>
        {listings.length === 0 ? (
          <p className="text-neutral-500">No listings pending moderation.</p>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="p-6 rounded-xl shadow-lg space-y-4">
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

      {/* Withdraw for Promoter */}
      <div className="lg:col-span-4 space-y-6 pt-0 md:pt-14">
        {/* Withdraw */}
        <div className="shadow-lg p-6 rounded-xl bg-white">
            <h2 className="text-lg font-semibold mb-4">Withdraw for Promoter</h2>
            <input
            type="text"
            placeholder="Enter Promoter userId"
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

        {/* Withdraw for Host */}
        <div className="shadow-lg p-6 rounded-xl bg-white">
          <h2 className="text-lg font-semibold mb-4">Withdraw for Host</h2>
          <input
            type="text"
            placeholder="Enter Host userId"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="border p-2 rounded-lg w-full mb-3"
          />
          <button
            onClick={handleWithdrawForHosts}
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

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10 px-60 pt-16">
      {/* Host Lookup */}
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-black">Host Analytics Lookup</h2>
        <input
          type="text"
          placeholder="Enter Host userId or Email"
          value={hostLookup}
          onChange={(e) => setHostLookup(e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
        <button
          onClick={handleHostAnalytics}
          className="w-full py-2 bg-black text-white rounded-lg hover:bg-neutral-800"
        >
          Fetch Host Data
        </button>
        {hostAnalytics && (
          <div className="text-sm text-neutral-700 space-y-1">
            <p><strong>Total Bookings:</strong> {hostAnalytics.totalBooks}</p>
            <p><strong>Total Revenue:</strong> €{hostAnalytics.totalRevenue * 0.9}</p>
            <p><strong>Payout Method:</strong> {hostAnalytics.payoutMethod.toUpperCase()}</p>
            <p><strong>Payout Number:</strong> {hostAnalytics.payoutNumber}</p>
          </div>
        )}
      </div>

      {/* Promoter Lookup */}
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-black">Promoter Analytics Lookup</h2>
        <input
          type="text"
          placeholder="Enter Promoter userId or Email"
          value={promoterLookup}
          onChange={(e) => setPromoterLookup(e.target.value)}
          className="w-full p-2 border rounded-lg"
        />
        <button
          onClick={handlePromoterAnalytics}
          className="w-full py-2 bg-black text-white rounded-lg hover:bg-neutral-800"
        >
          Fetch Promoter Data
        </button>
        {promoterAnalytics && (
          <div className="text-sm text-neutral-700 space-y-1">
            <p><strong>Total Books:</strong> {promoterAnalytics.totalBooks}</p>
            <p><strong>QR Code Scans:</strong> {promoterAnalytics.qrScans}</p>
            <p><strong>Total Revenue:</strong> €{promoterAnalytics.totalRevenue}</p>
            <p><strong>Payout Method:</strong> {promoterAnalytics.payoutMethod}</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ModerationClient;