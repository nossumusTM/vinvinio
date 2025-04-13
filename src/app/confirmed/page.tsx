"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Avatar from '@/app/components/Avatar';

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
  const listingId = getParam('listingId');

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;
      const res = await fetch(`/api/listings/${listingId}`);
      const data = await res.json();
      setListing(data);
    };

    fetchListing();
  }, [listingId]);

  return (
    <div className="max-w-screen-xl mx-auto p-6 py-10 flex flex-col lg:flex-row gap-10">
      {/* Listing Info */}
      <div className="w-full lg:w-2/3 bg-white shadow-md rounded-2xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-black">Booking Confirmed 🎉</h1>

        {listing && (
          <>
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
              <h2 className="text-xl font-semibold">{listing.title}</h2>
              <div className="flex items-center gap-3 mt-2">
                <Avatar src={listing.user?.image} name={listing.user?.name} />
                <div>
                  <p className="text-neutral-600 text-sm">Hosted by</p>
                  <p className="font-bold text-lg">{listing.user?.name}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Guest Info */}
      <div className="w-full lg:w-1/3 bg-white shadow-md rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-semibold">Guest Information</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Name:</strong> {legalName}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Contact:</strong> {contact}</p>
          <hr />
          <h3 className="font-semibold mt-4">Billing Address</h3>
          <p>{street}{apt ? `, Apt ${apt}` : ''}</p>
          <p>{city}, {state}, {zip}</p>
          <p>{country}</p>
        </div>

        <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-md mt-4 text-sm">
          A confirmation email has been sent to <strong>{email}</strong>. The host will contact you soon.
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmed;