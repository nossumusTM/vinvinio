"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Avatar from '@/app/components/Avatar';

import useMessenger from '@/app/hooks/useMessager';
import useLoginModal from '@/app/hooks/useLoginModal';

const BookingConfirmed = () => {
  const searchParams = useSearchParams();
  const [listing, setListing] = useState<any>(null);

  const getParam = (key: string) => searchParams?.get(key) || '';

  const legalName = getParam('legalName');
  const email = getParam('email');
  const contact = getParam('contact');
  const street = getParam('street');
  const apt = getParam('apt');
  const city = getParam('city');
  const state = getParam('state');
  const zip = getParam('zip');
  const country = getParam('country');
  const countryFlag = getParam('countryFlag');
  const listingId = getParam('listingId');
  const averageRating = getParam('averageRating');
  const reviewCount = getParam('reviewCount');
  const categoryLabel = getParam('categoryLabel');
  const startDate = getParam('startDate');

  const messenger = useMessenger();
  const loginModal = useLoginModal();


  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;
      const res = await fetch(`/api/listings/${listingId}`);
      const data = await res.json();
      setListing(data);
    };

    fetchListing();
  }, [listingId]);

  useEffect(() => {
    const runConfetti = async () => {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
  
      const confetti = (await import('canvas-confetti')).create(canvas, {
        resize: true,
        useWorker: true,
      });
  
      const duration = 2000;
      const end = Date.now() + duration;
  
      (function frame() {
        const oceanColors = ['#00CED1', '#1E90FF', '#4682B4', '#87CEEB', '#B0C4DE']; // tiffany, blue, steelblue, skyblue, grayish-blue

        confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: oceanColors,
        });
        confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: oceanColors,
        });

  
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
  
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(canvas);
      }, duration + 500);
    };
  
    runConfetti();
  }, []);  

  const handleContactHost = async () => {
    try {
      const res = await fetch('/api/users/current');
      const user = await res.json();
  
      if (!user?.id) {
        loginModal.onOpen();
        return;
      }
  
      if (listing?.user?.id) {
        messenger.openChat({
          id: listing.user.id,
          name: listing.user.name ?? 'Host',
          image: listing.user.image ?? '',
        });
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      loginModal.onOpen();
    }
  };  

  return (
    <div className="max-w-screen-xl mx-auto p-6 pt-8 pb-4 flex flex-col lg:flex-row gap-10">
      {/* Listing Info */}
      <div className="w-full lg:w-2/3 bg-white shadow-md rounded-2xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-black">Booking Confirmed!</h1>

        {listing && (
          <>
            {averageRating && reviewCount && (
                <div className="flex items-center gap-2 mt-2">
                    {/* SVG Star with gradient fill */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <defs>
                        <linearGradient id="starGradientConfirmed">
                        <stop offset={`${(parseFloat(averageRating) / 5) * 100}%`} stopColor="black" />
                        <stop offset={`${(parseFloat(averageRating) / 5) * 100}%`} stopColor="lightgray" />
                        </linearGradient>
                    </defs>
                            <path
                        fill="url(#starGradientConfirmed)"
                        d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                        14.81 8.63 12 2 9.19 8.63 2 9.24 
                        7.46 13.97 5.82 21 12 17.27z"
                    />
                    </svg>

                    <span className="text-sm text-neutral-600">
                    {parseFloat(averageRating).toFixed(1)} · {reviewCount} review{parseInt(reviewCount) !== 1 ? 's' : ''}
                    </span>
                </div>
                )}
            {listing.imageSrc && listing.imageSrc.length > 0 && (
              <Image
                src={listing.imageSrc[0]}
                alt={listing.title}
                width={600}
                height={400}
                className="rounded-xl w-full h-64 object-cover"
              />
            )}

            <div>

            {categoryLabel && (
                  <p className="text-sm text-neutral-500 mt-1">
                    Experience: <span className="font-normal text-black">{categoryLabel}</span>
                  </p>
                  )}

              <h2 className="text-xl font-semibold">{listing.title}</h2>

              <div className="flex items-center gap-3 mt-6">
                <Avatar src={listing.user?.image} name={listing.user?.name} />
                <div>
                  <div className='flex flex-row gap-6'>
                  <div className='flex flex-col justify-center'>
                    <p className="text-neutral-600 text-sm">Hosted by</p>
                    <p className="font-bold text-lg">{listing.user?.name}</p>
                    </div>

                    <button
                        onClick={handleContactHost}
                        className="text-sm text-black p-4 shadow-md rounded-xl font-medium hover:shadow-lg"
                        >
                        Message
                    </button>
                </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Guest Info */}
      <div className="w-full lg:w-1/3 bg-white shadow-md rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-semibold">Confirmation Details</h2>
        <div className="space-y-2 text-sm">
          {/* <p className="text-neutral-600 text-sm"><strong>ID:</strong> {listingId}</p> */}
          <p><strong>Name:</strong> {legalName}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Contact:</strong> {contact}</p>
          {startDate && (() => {
                try {
                    const dateObj = new Date(startDate);
                    const datePart = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    });
                    const timePart = dateObj.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    });
                    return (
                    <p className="text-neutral-600 text-sm">
                        <strong>Date:</strong> {datePart} at {timePart}
                    </p>
                    );
                } catch {
                    return <p className="text-neutral-600 text-sm">Date: Invalid</p>;
                }
            })()}
          <hr />
          <h3 className="font-semibold mt-4">Billing Address</h3>
          <p>{street}{apt ? `, ${apt}` : ''}</p>
          <p>{city}, {state}, {zip}</p>
          <p>
            {countryFlag && (
                <span className="mr-1 text-xl">{countryFlag}</span>
            )}
            {country}
            </p>
          <hr />
          <p>
                <strong>Guest Count:</strong> {searchParams?.get('guests') || 'N/A'}
            </p>

            <p>
                <strong>Total Paid:</strong> €
                {(() => {
                const price = parseFloat(searchParams?.get('price') || '0');
                const guests = parseInt(searchParams?.get('guests') || '1', 10);
                return (price * guests).toFixed(2);
                })()}
            </p>
        </div>

        {/* <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-md mt-4 text-sm">
          A confirmation email has been sent to <strong>{email}</strong>. The host will contact you soon.
        </div> */}
        <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-md mt-4 text-sm space-y-2">
            <p>
                A confirmation email has been sent to <strong>{email}</strong>. The host will contact you soon.
            </p>

            {!searchParams?.get('auth') && (
                <p className="pt-2 text-xs text-neutral-500">
                If you want to contact the host, <strong>create an account</strong> and message them directly via our built-in messenger.
                </p>
            )}
            </div>
      </div>
    </div>
  );
};

export default BookingConfirmed;