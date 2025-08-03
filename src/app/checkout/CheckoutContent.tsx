'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import CheckoutForm from './CheckoutForm';
import { PaymentElement, CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { format } from 'date-fns';
import { TbCalendarTime } from "react-icons/tb";
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

import getCurrentUser from  '@/app/actions/getCurrentUser';
import { useSession } from 'next-auth/react';

import Button from '@/app/components/Button';
import Heading from '@/app/components/Heading';
import Avatar from '../components/Avatar';
import dynamic from 'next/dynamic';

import useLoginModal from '@/app/hooks/useLoginModal';
import useRegisterModal from '@/app/hooks/useRegisterModal';

interface Props {
  clientSecret: string | null;
  setAmount: (amount: number) => void;
}

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

const CheckoutContent: React.FC<Props> = ({ clientSecret, setAmount }) => {

  const router = useRouter();
  const searchParams = useSearchParams();

  const stripe = useStripe(); // ✅ Valid here
  const elements = useElements();

  const { data: session, status } = useSession();

  const [selectedMethod, setSelectedMethod] = useState<'card' | 'klarna'>('card');

  let paymentMethodData: any;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'auth'>('guest');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');

  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);

  const [userCoupon, setUserCoupon] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);

  // console.log("ReferralId", referralId);
  // console.log("Storage", localStorage);


  useEffect(() => {
    const stored = localStorage.getItem('scannedReferenceId');
    setReferralId(stored);
  }, []);

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

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    
    const newInvalidFields: string[] = [];

    // ✅ Guest-specific validation
    if (checkoutMode === 'guest') {
        if (!legalName.trim()) newInvalidFields.push('legalName');
        if (!email.trim() || !email.includes('@')) newInvalidFields.push('email');
    }

    // General validation
    if (!listingId || !startDate || !endDate || !time || !guests || !listingData) {
        setPopupMessage("Missing booking information.");
        return;
    }

    if (!contact.trim()) {
        newInvalidFields.push('contact');
    }

    if (newInvalidFields.length > 0) {
        setInvalidFields(newInvalidFields);
        setPopupMessage("Please fill out the required fields.");
        return;
    }

    setIsLoading(true);

    try {
        const totalPrice = total;

        // ✅ 1. Create Stripe PaymentIntent
        const paymentIntentRes = await axios.post('/api/create-payment-intent', {
        amount: Math.round(totalPrice * 100), // cents
        email, // used for Klarna and other methods
        });

        const clientSecret = paymentIntentRes.data.clientSecret;

        if (!stripe || !elements || !clientSecret) {
        toast.error("Payment initialization failed.");
        setIsLoading(false);
        return;
        }

        // ✅ 2. Confirm payment using selected method (card/Klarna/etc.)
        const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: window.location.href, // Optional, if you want Stripe to handle redirection
            payment_method_data: {
            billing_details: {
                name: legalName,
                email,
            },
            },
        },
        redirect: "if_required",
        });

        if (result.error) {
        toast.error(result.error.message || "Payment failed");
        setIsLoading(false);
        return;
        }

        if (result.paymentIntent?.status !== "succeeded") {
        toast.error("Payment not completed.");
        setIsLoading(false);
        return;
        } else {
            // ✅ 3. Payment succeeded — now proceed with reservation
            await axios.post('/api/reservations', {
            totalPrice,
            startDate: format(new Date(startDate), 'yyyy-MM-dd'),
            endDate: format(new Date(endDate), 'yyyy-MM-dd'),
            listingId,
            selectedTime: time,
            guestCount: guests,
            legalName,
            contact,
            referralId,
            });

            if (scannedReferenceId) {
            await axios.post('/api/analytics/update', {
                referenceId: scannedReferenceId,
                totalBooksIncrement: 1,
                totalRevenueIncrement: listingData.price * guests + serviceFee
            });
            }

            if (userCoupon) {
            try {
                const res = await axios.get('/api/coupon/getusercoupon');
                const couponCode = res.data.code;

                if (couponCode === userCoupon) {
                await axios.post('/api/coupon/markused', { code: couponCode });
                }
            } catch (err) {
                console.warn('Failed to mark coupon as used:', err);
            }
            }

            // ✅ Build and redirect to confirmation URL (auth or guest)
            const baseQuery = {
            legalName,
            email,
            contact,
            startDate,
            time,
            street: addressFields.street,
            apt: addressFields.apt,
            city: addressFields.city,
            state: addressFields.state,
            zip: addressFields.zip,
            country: addressFields.country?.label || '',
            countryValue: addressFields.country?.value?.split('-').pop()?.toLowerCase() || '',
            listingId: listingId || '',
            guests: guests.toString(),
            price: (discountPercentage
                ? (listingData?.price * (1 - discountPercentage / 100)).toFixed(2)
                : listingData?.price?.toString() || '0'),
            auth: isAuthenticated ? 'true' : '',
            averageRating: (
                reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : '0'
            ),
            reviewCount: reviews.length.toString(),
            categoryLabel: listingData?.category || '',
            };

            router.push(`/confirmed?${new URLSearchParams(baseQuery).toString()}`);

            // ✅ Email confirmation for guest
            if (checkoutMode === 'guest') {
            const formattedDateTime = (() => {
                try {
                const baseDate = new Date(startDate);
                const [hourStr, minuteStr] = time.split(':');
                baseDate.setHours(parseInt(hourStr));
                baseDate.setMinutes(parseInt(minuteStr));
                return `${baseDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                })} ${baseDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                })}`;
                } catch (err) {
                console.error('Date formatting error:', err);
                return 'Unavailable';
                }
            })();

            const { street, apt, city, state, zip, country } = addressFields;
            const countryLabel = country?.label || '';
            const countryFlag = country?.flag || '';

            await axios.post('/api/email/booking', {
                to: email,
                subject: 'Your Vuola Booking Confirmation',
                listingId,
                html: `...`, // Keep your existing HTML here
            });
            }

            setIsLoading(false);
        }
    } catch (error) {
        console.error('Error during booking:', error);
        toast.error('Something went wrong. Please try again.');
    } finally {
        setIsLoading(false);
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

  const subtotal = useMemo(() => {
    return listingData ? listingData.price * guests : 0;
  }, [listingData, guests]);
  
  const discountAmount = useMemo(() => {
    return subtotal * (discountPercentage / 100);
  }, [subtotal, discountPercentage]);
  
  const total = useMemo(() => {
    return subtotal - discountAmount + serviceFee;
  }, [subtotal, discountAmount, serviceFee]);

    React.useEffect(() => {
        if (total > 0) {
            setAmount(total);
        }
    }, [total, setAmount]);

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
      if (!isAuthenticated) return;

      try {
        const res = await axios.get('/api/users/profile-info');
        const { contact, address, legalName} = res.data;
  
        if (contact) setContact(contact);
        if (legalName) {
          setLegalName(legalName);
        }
  
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
  }, [isAuthenticated]);  

  useEffect(() => {
    if (!listingId || !isAuthenticated) return;
  
    const fetchSavedCard = async () => {
      try {
        const cardRes = await axios.get('/api/users/get-card');
        const saved = cardRes.data;
  
        if (!saved) return;
  
        const formattedNumber = saved.number
          .replace(/\D/g, '')
          .slice(0, 16)
          .replace(/(.{4})/g, '$1 ')
          .trim();
  
        setCardInfo((prev) => ({
          ...prev,
          method: 'card',
          number: formattedNumber,
        }));
  
        setCardType(detectCardType(formattedNumber));
        setInvalidFields((prev) => prev.filter((field) => field !== 'number'));
      } catch (err) {
        console.error('❌ Failed to fetch saved card:', err);
      }
    };
  
    fetchSavedCard();
  }, [listingId, isAuthenticated]);  

  useEffect(() => {
    if (!listingId) return;
  
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews/get-by-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });
  
        const reviewData = await res.json();
        setReviews(reviewData || []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }
    };
  
    fetchReviews();
  }, [listingId]);
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      setIsAuthenticated(true);
      setCheckoutMode('auth');
      if (session.user.name) setLegalName(session.user.name);
      if (session.user.email) setEmail(session.user.email);
    }
  }, [session, status]);

  useEffect(() => {
    // if (checkoutMode === 'guest') return;

    const checkUser = async () => {
      try {
        const res = await axios.get('/api/users/current');
        if (res?.data?.id) {
          setIsAuthenticated(true);
          setCheckoutMode('auth');
          if (res.data.legalName) setLegalName(res.data.legalName);
          if (res.data.email) setEmail(res.data.email);
        }
      } catch (err) {
        console.log('Guest checkout mode activated');
        setIsAuthenticated(false);
      }
    };
  
    checkUser();
  }, [checkoutMode]);  

  useEffect(() => {
    if (!isAuthenticated) return;
  
    const fetchCoupon = async () => {
      try {
        const res = await axios.get('/api/coupon/getusercoupon');
        const { code, discount, used } = res.data;
  
        if (code && !used && discount) {
          setUserCoupon(code);
          setDiscountPercentage(discount);
        } else {
          // Prevent applying used coupons
          setUserCoupon(null);
          setDiscountPercentage(0);
        }
      } catch (err) {
        console.error('No active coupon:', err);
        setUserCoupon(null);
        setDiscountPercentage(0);
      }
    };
  
    fetchCoupon();
  }, [isAuthenticated]);    

    useEffect(() => {
  if (total > 0) {
    setAmount(total * 100);  // pass cents to parent to create PaymentIntent
  }
}, [total, setAmount]);

    if (!clientSecret) return <div className="pt-0"><Loader /></div>;

  // const total = listingData ? listingData.price * guests + serviceFee : 0;

  // const subtotal = listingData ? listingData.price * guests : 0;
  // const discountAmount = subtotal * (discountPercentage / 100);
  // const total = subtotal - discountAmount + serviceFee;

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
          {/* {referralId && (
              <div className="text-xs text-neutral-500 mt-2">
                <span className="font-semibold">Referral ID:</span> {referralId}
              </div>
            )} */}
        </div>

        {!isAuthenticated && (
          <div className="flex justify-between items-center gap-4 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setCheckoutMode('guest')}
                className={`text-sm font-medium ${checkoutMode === 'guest' ? 'text-black underline' : 'text-neutral-500'}`}
              >
                Continue as Guest
              </button>
              <span className="text-neutral-400">|</span>
              <button
                onClick={() => {
                  loginModal.onOpen();
                  // setCheckoutMode('auth');
                }}
                className={`text-sm font-medium ${checkoutMode === 'auth' ? 'text-black underline' : 'text-neutral-500'}`}
              >
                Sign In / Sign Up
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-md font-semibold">Legal Name</h3>
          <input
            type="text"
            name="legalName"
            placeholder="Full name (Name and Surname)"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {checkoutMode === 'guest' && (
          <>
            <div className="space-y-2">
              <h3 className="text-md font-semibold">Email</h3>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border p-2 rounded-lg"
              />
            </div>
          </>
        )}

        {/* Contact Info */}
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Contact Preference</h3>
          <input
            type="text"
            name="contact"
            placeholder="WhatsApp: +39-321-555-05-05"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full border p-2 rounded-lg"
          />
        </div>

        {/* <CheckoutForm /> */}

        {/* Payment Info */}

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

        <div className="mt-4 peer w-full border border-neutral-300 rounded-md p-6 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black">
           

            {/* <CardElement options={{ hidePostalCode: true }} /> */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold">Payment Method</h3>
          <PaymentElement />
        </div>
                    
        </div>

          <Button 
            label={isLoading ? 'Processing...' : `Confirm and Pay €${total}`}
            onClick={handleSubmit} 
            disabled={isLoading}
            />
        {/* )} */}
      </div>

      {/* RIGHT SECTION */}
      <div className="w-full lg:w-1/3">
        <div className="md:sticky md:top-32">
          <div className="bg-white rounded-2xl shadow-md p-6 space-y-7">
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
                <p className="text-neutral-600 text-sm text-left">Guided by</p>
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

            <div className="space-y-2 pt-1">
            {userCoupon && (
              <div className="flex items-center justify-between text-lg text-neutral-800 font-semibold">
                <span className='text-md font-normal border-b border-neutral-800'>Voucher</span>
                <span className="bg-green-100 border border-green-400 rounded px-3 py-1 ml-4 text-sm font-medium whitespace-nowrap">
                  {userCoupon}
                </span>
              </div>
            )}

            {!userCoupon && (
              <>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter voucher code"
                    className="w-full shadow-md p-4 rounded-xl pr-24"
                  />
                  <button
                    onClick={async () => {
                      if (!couponCode) return toast.error('Enter a coupon code');
                      if (couponCode === userCoupon) return toast.error('You already applied this coupon');

                      try {
                        const res = await axios.post('/api/coupon/addcoupon', { code: couponCode });
                        toast.success(`Coupon "${couponCode}" applied!`, {
                          iconTheme: {
                            primary: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
                            secondary: '#fff',
                          },
                        });
                        setUserCoupon(couponCode);
                        setCouponCode('');
                        setDiscountPercentage(res.data.discount || 0);
                      } catch (err: any) {
                        toast.error(err?.response?.data?.error || 'Coupon invalid or expired');
                      }
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black text-white px-4 py-2 rounded-xl hover:bg-neutral-800 transition text-sm"
                  >
                    Apply
                  </button>
                </div>
              </>
            )}

            </div>

            <hr />

            {subtotal > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className={discountAmount > 0 ? 'text-green-700 font-semibold' : ''}>
                  -€{discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total in EUR</span>
              <span>€{total}</span>
            </div>
          </>
        )}
      </div>
      </div>
      </div>
    </div>
  );
};

export default CheckoutContent;