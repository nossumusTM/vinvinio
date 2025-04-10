'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { format } from 'date-fns';
import { TbCalendarTime } from "react-icons/tb";
import toast from 'react-hot-toast';

 import getCurrentUser from  '@/app/actions/getCurrentUser';
import { useSession } from 'next-auth/react';

import Button from '@/app/components/Button';
import Heading from '@/app/components/Heading';
import Avatar from '../components/Avatar';
import dynamic from 'next/dynamic';

const CountrySelect = dynamic(() => import('@/app/components/inputs/CountrySelect'), {
  ssr: false,
});
// import CountrySelect from '@/app/components/inputs/CountrySelect';
import { CountrySelectValue } from '@/app/components/inputs/CountrySelect';
import ConfirmPopup from '../components/ConfirmPopup';

const detectCardType = (number: string) => {
    const sanitized = number.replace(/\s/g, '');
    if (/^4/.test(sanitized)) return 'Visa';
    if (/^5[1-5]/.test(sanitized)) return 'MasterCard';
    if (/^3[47]/.test(sanitized)) return 'AmericanExpress';
    if (/^6(?:011|5)/.test(sanitized)) return 'Discover';
    // if (/^(5018|5020|5038|6304|6759|6761|6763)/.test(sanitized)) return 'Maestro';
    return '';
};  

type AddressFields = {
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  country?: CountrySelectValue;
};

type Review = {
  rating: number;
  comment?: string;
  createdAt?: string;
};

const CheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listingData, setListingData] = useState<any>(null);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [country, setCountry] = useState<any>(null);
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiration: '',
    cvv: '',
    name: '',
    address: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
    method: 'card'
  });

  const [contact, setContact] = useState('');
  const [addressFields, setAddressFields] = useState<AddressFields>({
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
    country: undefined,
  });

  const [cardType, setCardType] = useState('');
  const [randomImage, setRandomImage] = useState<string | null>(null);

  const hasFetched = useRef(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const scannedReferenceId = typeof window !== 'undefined' ? localStorage.getItem('scannedReferenceId') : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardInfo({ ...cardInfo, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (value: string) => {
    // Only update if the incoming value differs from current state
  
    const formatted = value
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();
  
    setCardInfo((prev) => ({ ...prev, number: formatted }));
    setCardType(detectCardType(formatted));
    setInvalidFields((prev) => prev.filter((field) => field !== 'number'));
  };  

  const handleSubmit = async () => {
    const newInvalidFields: string[] = [];
  
    if (!listingId || !startDate || !endDate || !time || !guests || !listingData) {
      setPopupMessage("Missing booking information.");
      return;
    }
  
    if (!contact.trim()) {
      newInvalidFields.push('contact');
    }
  
    if (cardInfo.method === 'card') {
      if (!cardInfo.number.trim()) newInvalidFields.push('number');
      if (!cardInfo.expiration.trim()) newInvalidFields.push('expiration');
      if (!cardInfo.cvv.trim()) newInvalidFields.push('cvv');
  
      const { street, city, state, zip, country } = addressFields;
      if (!street.trim()) newInvalidFields.push('street');
      if (!city.trim()) newInvalidFields.push('city');
      if (!state.trim()) newInvalidFields.push('state');
      if (!zip.trim()) newInvalidFields.push('zip');
      if (!country) newInvalidFields.push('country');
    }
  
    if (newInvalidFields.length > 0) {
      setInvalidFields(newInvalidFields);
      setPopupMessage("Please fill out the required fields.");
      return;
    }
  
    try {
      await axios.post('/api/reservations', {
        totalPrice: listingData.price * guests + serviceFee,
        startDate,
        endDate,
        listingId,
        selectedTime: time,
        guestCount: guests,
      });
  
      if (scannedReferenceId) {
        await axios.post('/api/analytics/update', {
          referenceId: scannedReferenceId,
          totalBooksIncrement: 1,
          totalRevenueIncrement: listingData.price * guests + serviceFee
        });
      }
  
      toast.success('Payment confirmed! Reservation created.', {
        iconTheme: {
            primary: '#25F4EE',
            secondary: '#fff',
        },
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      setPopupMessage("Something went wrong. Please try again.");
    }
  };    

  const listingId = searchParams?.get('listingId');
  const guests = parseInt(searchParams?.get('guests') || '1');
  const startDate = searchParams?.get('startDate');
  const endDate = searchParams?.get('endDate');
  const time = searchParams?.get('time');

  const formattedStart = startDate ? format(new Date(startDate), 'PP') : '';
  const formattedEnd = endDate ? format(new Date(endDate), 'PP') : '';

  const serviceFee = 0;

  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
        try {
          const res = await axios.get(`/api/listings/${listingId}`);
          setListingData(res.data);
      
          // Set a random image only once
          if (Array.isArray(res.data.imageSrc) && res.data.imageSrc.length > 0) {
            const randomIndex = Math.floor(Math.random() * res.data.imageSrc.length);
            setRandomImage(res.data.imageSrc[randomIndex]);
          }
        } catch (error) {
          console.error('Failed to fetch listing:', error);
        }
      };      

    fetchListing();
  }, [listingId]);

  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        const res = await axios.get('/api/users/profile-info');
        const { contact, address } = res.data;
  
        if (contact) setContact(contact);
  
        if (address) {
          try {
            const parsed = JSON.parse(address);
  
            setAddressFields({
              street: parsed.street || '',
              apt: parsed.apt || '',
              city: parsed.city || '',
              state: parsed.state || '',
              zip: parsed.zip || '',
              country: typeof parsed.country === 'object' ? parsed.country : undefined,
            });
          } catch (parseError) {
            console.error('Error parsing address:', parseError);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile info:', error);
      }
    };
  
    fetchProfileInfo();
  }, []);  

  useEffect(() => {
    if (hasFetched.current || !listingId) return;
    hasFetched.current = true;
  
    const fetchData = async () => {
      try {
        const reviewRes = await fetch('/api/reviews/get-by-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });
        const reviewData = await reviewRes.json();
        setReviews(reviewData || []);
  
        const cardRes = await axios.get('/api/users/get-card');
        const saved = cardRes.data;

          const CryptoJS = await import('crypto-js');
          const key = process.env.CARD_SECRET_KEY;
  
          if (!key) {
            console.warn('❗️Missing CARD_SECRET_KEY');
            return;
          }
  
          const decrypt = (txt: string) =>
            CryptoJS.AES.decrypt(txt, key).toString(CryptoJS.enc.Utf8);
  
          const looksEncrypted = (str: string) => /^[A-Za-z0-9+/=]+$/.test(str) && str.length > 16;

          const rawNumber = looksEncrypted(saved.number) ? decrypt(saved.number) : saved.number;
          const expiration = looksEncrypted(saved.expiration) ? decrypt(saved.expiration) : saved.expiration;
          const cvv = looksEncrypted(saved.cvv) ? decrypt(saved.cvv) : saved.cvv;
          
          const formattedNumber = rawNumber
            .replace(/\D/g, '')
            .slice(0, 16)
            .replace(/(.{4})/g, '$1 ')
            .trim();
  
          // 🔥 Final, working way: ONE update to state
          setCardInfo((prev) => ({
            ...prev,
            method: 'card', // trigger visibility
            number: formattedNumber,
            expiration,
            cvv,
          }));          
  
          setCardType(detectCardType(formattedNumber));
          setInvalidFields((prev) => prev.filter((field) => field !== 'number'));

          // console.log('formatted number', formattedNumber);

      } catch (err) {
        console.error('❌ Failed to fetch card:', err);
      }
    };
  
    fetchData();
  }, [listingId]);  

  const total = listingData ? listingData.price * guests + serviceFee : 0;

  return (
    <div className="flex flex-col lg:flex-row max-w-screen-xl mx-auto px-4 py-10 gap-10">
      {/* LEFT SECTION */}
      <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-md p-6 space-y-6">
      <div className='flex flex-row gap-4'>
        <button
            onClick={() => router.push(`/listings/${listingId}`)}
            className="text-sm text-black hover:underline mb-2"
          >
            ←
          </button>

          <Heading title="Confirm and Pay" />
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Contact Information</h3>
          <input
            type="text"
            name="contact"
            placeholder="WhatsApp: +39-321-555-05-05"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* Card Info */}
        {/* <div className="space-y-2">
          <h3 className="text-md font-semibold">Pay with credit or debit card</h3>
          <input
            type="text"
            name="number"
            placeholder="Card number"
            value={cardInfo.number}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <div className="flex gap-4">
            <input
              type="text"
              name="expiration"
              placeholder="MM/YY"
              value={cardInfo.expiration}
              onChange={handleChange}
              className="w-1/2 border p-2 rounded"
            />
            <input
              type="text"
              name="cvv"
              placeholder="CVV"
              value={cardInfo.cvv}
              onChange={handleChange}
              className="w-1/2 border p-2 rounded"
            />
          </div>
        </div> */}

        {/* Payment Info */}
        <div className="space-y-4">
        <div className="flex flex-row justify-between items-center">
            <h3 className="text-md font-semibold pt-1">Payment Method</h3>

            {cardInfo.method === 'card' && (
                <div className="flex items-center gap-4 ">
                <Image width={50} height={50} src="/images/visa.png" alt="Visa" className="h-3 w-auto object-contain" />
                <Image width={50} height={50} src="/images/mastercard.png" alt="MasterCard" className="h-5 w-auto object-contain" />
                <Image width={50} height={50} src="/images/AmericanExpress.png" alt="American Express" className="h-7 w-auto object-contain" />
                </div>
            )}

            {cardInfo.method === 'paypal' && (
                <Image width={50} height={50} src="/images/paypal.png" alt="PayPal" className="h-6 w-auto object-contain mb-1" />
            )}

            {cardInfo.method === 'gpay' && (
                <Image width={50} height={50} src="/images/gpay.png" alt="Google Pay" className="h-6 w-auto object-contain mb-1" />
            )}
        </div>

        <select
            name="method"
            value={cardInfo.method || 'card'}
            onChange={(e) =>
            setCardInfo({ ...cardInfo, method: e.target.value })
            }
            className="w-full border p-2 rounded-lg"
        >
            <option value="card">Credit/Debit Card</option>
            <option value="paypal">PayPal</option>
            <option value="gpay">Google Pay</option>
        </select>

        {cardInfo.method === 'card' && (
          <>
            {/* Card Number with label */}
            <div className="relative">
            <input
                type="text"
                id="cardNumber"
                name="number"
                placeholder=" "
                value={cardInfo.number}
                onChange={(e) => handleNumberChange(e.target.value)}
                className={`peer w-full border ${
                  invalidFields.includes('number') ? 'border-red-500' : 'border-neutral-300'
                } rounded-md px-4 pt-6 pb-2 text-base pr-14 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black`}
              />
              <label
                htmlFor="cardNumber"
                className={`
                  absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                  peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                  peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                  ${cardInfo.number ? 'top-2 text-sm text-black' : ''}
                `}
              >
                Card Number
              </label>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Image
                  src={
                    cardInfo.number.trim() === ''
                      ? '/images/card.png'
                      : `/images/${cardType || 'card'}.png`
                  }
                  alt="Card Type"
                  className="w-8 h-5 object-contain"
                  width={50} height={50}
                />
              </div>
            </div>

            {/* Expiration and CVV */}
            <div className="flex gap-4">
              {/* Expiration */}
              <div className="relative w-1/2">
              <input
                  type="text"
                  id="expiration"
                  name="expiration"
                  placeholder=" "
                  value={cardInfo.expiration || ''}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, '').slice(0, 4); // Only digits, max 4
                    let month = raw.slice(0, 2);
                    let yearFirst = raw.charAt(2);  // 3rd digit
                    let yearSecond = raw.charAt(3); // 4th digit
                  
                    // Validate month
                    if (month && (parseInt(month) < 1 || parseInt(month) > 12)) return;
                  
                    // Prevent year from starting with anything other than '2'
                    if (yearFirst && yearFirst !== '2') return;
                  
                    // Prevent full year like '21', '22', etc.
                    if (yearFirst === '2' && yearSecond && parseInt(yearSecond) < 5) return;
                  
                    // Format as MM/YY
                    let formatted = month;
                    if (yearFirst) {
                      formatted += '/' + yearFirst;
                    }
                    if (yearFirst && yearSecond) {
                      formatted += yearSecond;
                    }
                  
                    setCardInfo({ ...cardInfo, expiration: formatted });
                  
                    // ✅ Remove from invalid fields if complete and valid
                    if (
                      month.length === 2 &&
                      yearFirst === '2' &&
                      yearSecond &&
                      parseInt(month) >= 1 &&
                      parseInt(month) <= 12 &&
                      parseInt(yearSecond) >= 5
                    ) {
                      setInvalidFields((prev) => prev.filter((f) => f !== 'expiration'));
                    }
                  }}                                   
                  className={`peer w-full border ${
                    invalidFields.includes('expiration') ? 'border-red-500' : 'border-neutral-300'
                  } rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black`}
                />
                <label
                  htmlFor="expiration"
                  className={`
                    absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                    peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                    ${cardInfo.expiration ? 'top-2 text-sm text-black' : ''}
                  `}
                >
                  (MM/YY)
                </label>
              </div>

              {/* CVV */}
              <div className="relative w-1/2">
              <input
                  type="text"
                  id="cvv"
                  name="cvv"
                  placeholder=" "
                  value={cardInfo.cvv || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                    setCardInfo({ ...cardInfo, cvv: val });
                  
                    if (val.length === 3) {
                      setInvalidFields((prev) => prev.filter((field) => field !== 'cvv'));
                    }
                  }}                  
                  className={`peer w-full border ${
                    invalidFields.includes('cvv') ? 'border-red-500' : 'border-neutral-300'
                  } rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black`}
                />
                <label
                  htmlFor="cvv"
                  className={`
                    absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                    peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                    ${cardInfo.cvv ? 'top-2 text-sm text-black' : ''}
                  `}
                >
                  CVV
                </label>
              </div>
            </div>
              {/* ⚠️ Info message */}
              <p className="text-xs text-neutral-500 pt-2">
                ⚠️ We do not store your card details. All payments are securely processed over SSL.
              </p>
          </>
        )}

        {cardInfo.method === 'paypal' && (
            <div className="text-sm text-neutral-600">
            You will be redirected to PayPal to complete your payment.
            </div>
        )}

        {cardInfo.method === 'gpay' && (
            <div className="text-sm text-neutral-600">
            GPay selected. You’ll confirm payment via Google Pay.
            </div>
        )}
        </div>

        {/* Billing Address */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Billing Address</h3>

          {/* Street */}
          <div className="relative w-full">
            <input
              type="text"
              id="street"
              name="street"
              placeholder=" "
              value={addressFields.street}
              onChange={(e) => setAddressFields({ ...addressFields, street: e.target.value })}
              className="peer w-full border border-neutral-300 rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
            />
            <label
              htmlFor="street"
              className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                ${addressFields.street ? 'top-2 text-sm text-black' : ''}`}
            >
              Street address
            </label>
          </div>

          {/* Apt */}
          <div className="relative w-full">
            <input
              type="text"
              id="apt"
              name="apt"
              placeholder=" "
              value={addressFields.apt}
              onChange={(e) => setAddressFields({ ...addressFields, apt: e.target.value })}
              className="peer w-full border border-neutral-300 rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
            />
            <label
              htmlFor="apt"
              className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                ${addressFields.apt ? 'top-2 text-sm text-black' : ''}`}
            >
              Apt or suite (optional)
            </label>
          </div>

          {/* City and State */}
          <div className="flex gap-4">
            {/* City */}
            <div className="relative w-1/2">
              <input
                type="text"
                id="city"
                name="city"
                placeholder=" "
                value={addressFields.city}
                onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
                className="peer w-full border border-neutral-300 rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
              />
              <label
                htmlFor="city"
                className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                  peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                  peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                  ${addressFields.city ? 'top-2 text-sm text-black' : ''}`}
              >
                City
              </label>
            </div>

            {/* State */}
            <div className="relative w-1/2">
              <input
                type="text"
                id="state"
                name="state"
                placeholder=" "
                value={addressFields.state}
                onChange={(e) => setAddressFields({ ...addressFields, state: e.target.value })}
                className="peer w-full border border-neutral-300 rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
              />
              <label
                htmlFor="state"
                className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                  peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                  peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                  ${addressFields.state ? 'top-2 text-sm text-black' : ''}`}
              >
                State / Province
              </label>
            </div>
          </div>

          {/* ZIP */}
          <div className="relative w-full">
            <input
              type="text"
              id="zip"
              name="zip"
              placeholder=" "
              value={addressFields.zip}
              onChange={(e) => setAddressFields({ ...addressFields, zip: e.target.value })}
              className="peer w-full border border-neutral-300 rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
            />
            <label
              htmlFor="zip"
              className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                ${addressFields.zip ? 'top-2 text-sm text-black' : ''}`}
            >
              ZIP Code
            </label>
          </div>

          {/* Country */}
          <CountrySelect
            value={addressFields.country}
            onChange={(value) => setAddressFields({ ...addressFields, country: value })}
          />
        </div>

        {/* ✅ Show correct button based on selected method */}
        {cardInfo.method === 'gpay' ? (
        <button className="mt-4 bg-black text-white p-3 rounded font-semibold w-full">
            Pay with Google Pay
        </button>
        ) : cardInfo.method === 'paypal' ? (
        <button className="mt-4 bg-[#003087] text-white p-3 rounded font-semibold w-full">
            Proceed with PayPal
        </button>
        ) : (
        <Button label="Confirm and Pay" onClick={handleSubmit} />
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-md p-6 space-y-7 h-fit max-h-[700px]">
      {listingData && (
          <>
            {randomImage && (
              <Image
                key={randomImage} // 🧠 helps force re-render
                src={randomImage}
                alt={listingData.title}
                width={400}
                height={300}
                className="rounded-xl w-full h-60 object-cover"
                onError={() => setRandomImage('/images/fallback.jpg')} // 👈 fallback
                priority // 🚀 hint Next.js to preload
              />
            )}

            <div className='flex flex-col gap-2'>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
                  <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                          14.81 8.63 12 2 9.19 8.63 2 9.24 
                          7.46 13.97 5.82 21 12 17.27z" />
                </svg>
                <span className="font-medium">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <h3 className="text-xl font-semibold">{listingData.title}</h3>
            </div>
            
            <div className="flex flex-row items-center gap-3">
            {/* Avatar on the left */}
              <Avatar
                src={listingData.user?.image}
                name={listingData.user?.name}
              />

              {/* Text block on the right, stacked vertically */}
              <div className="flex flex-col">
                <p className="text-neutral-600 text-sm text-left">Hosted by</p>
                <p className="text-neutral-700 text-lg font-bold text-left">
                  {listingData.user?.name || 'Anonymous'}
                </p>
              </div>
            </div>
            
            <hr />
            <div className="text-md space-y-2">
            <div>
            {/* <p className="text-neutral-500 font-semibold mb-1">Booking information:</p> */}
                <div className="flex flex-row gap-2">
                  {/* <p className="text-lg font-medium"><TbCalendarTime /></p> */}
                  <p className="text-neutral-700 font-normal">
                    {formattedStart} at {
                      time ? (() => {
                        const [hour, minute] = time.split(':').map(Number);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
                        return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
                      })() : 'Time unavailable'
                    }
                  </p>
                </div>
                {/* <p className="text-neutral-700 font-bold">Guests: {guests}</p> */}
              </div>
              <div className="flex justify-between">
                <span>€{listingData.price} x {guests} {guests === 1 ? 'guest' : 'guests'}</span>
                <span>€{listingData.price * guests}</span>
              </div>

              <div className="flex justify-between">
                <span>Service fee</span>
                <span>€{serviceFee}</span>
              </div>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total in EUR</span>
              <span>€{total}</span>
            </div>
          </>
        )}
      </div>
      {popupMessage && (
        <ConfirmPopup
          title="Notice"
          message={popupMessage}
          confirmLabel="OK"
          hideCancel
          onConfirm={() => {
            if (popupMessage.includes('confirmed')) {
              router.push('/trips');
            }
            setPopupMessage(null);
          }}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
