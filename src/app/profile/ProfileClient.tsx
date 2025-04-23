'use client';

import { useRef, useState, useEffect } from "react";
import { SafeUser } from "@/app/types";
import { formatCurrency } from "@/app/utils/format";
import Container from "@/app/components/Container";
import Heading from "@/app/components/Heading";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import CryptoJS from 'crypto-js';
import axios from "axios";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/app/utils/cropImage';
import CountrySelect from "../components/inputs/CountrySelect";
import { CountrySelectValue } from "@/app/components/inputs/CountrySelect";
import AnimatedModal from "../components/modals/AnimatedModal";
import { AnimatePresence, motion } from 'framer-motion';
import { TbUserCircle, TbLock, TbCreditCard } from "react-icons/tb";
import { CgUserlane } from "react-icons/cg";
import { MdOutlineSecurity } from "react-icons/md";
import { RiSecurePaymentLine } from "react-icons/ri";
import ConfirmPopup from "../components/ConfirmPopup";
import EarningsCard from "../components/EarnigsCard";
import FAQ from "../components/FAQ";
import toast from "react-hot-toast";
export const dynamic = 'force-dynamic';

interface ProfileClientProps {
  currentUser: SafeUser;
  referralBookings: {
    totalCount: number;
    totalAmount: number;
  };
}

interface EarningsEntry {
  date: string;
  amount: number;
}

const getRandomColor = () => {
  const colors = [
    'bg-[#08e2ff]'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const ProfileClient: React.FC<ProfileClientProps> = ({
  currentUser,
  referralBookings,
}) => {
  const { totalCount, totalAmount } = referralBookings;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState(currentUser.image || '');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showConfirmDeletePayout, setShowConfirmDeletePayout] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [earnings, setEarnings] = useState<{
    daily: EarningsEntry[];
    monthly: EarningsEntry[];
    yearly: EarningsEntry[];
    dailyProfit: number;
    totalEarnings: number;
  }>({
    daily: [],
    monthly: [],
    yearly: [],
    dailyProfit: 0,
    totalEarnings: 0,
  });  

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<{
    name: string;
    email: string;
    phone: string;
    contact: string;
    legalName: string;
    country: CountrySelectValue | null;
    street: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
  }>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    contact: currentUser?.contact || '',
    legalName: currentUser?.legalName || '',
    country: null,
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: ''
  });  

  const [activePaymentTab, setActivePaymentTab] = useState<'payment' | 'payout'>('payment');
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [userCoupon, setUserCoupon] = useState<string | null>(null);

  const [savedCard, setSavedCard] = useState<any>(null);
  const [cardUpdated, setCardUpdated] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [payoutInfo, setPayoutInfo] = useState({
    method: 'card', // 'card' | 'iban' | 'paypal' | 'revolut'
    number: '',
  });  
  
  const [savedPayout, setSavedPayout] = useState<any>(null);
  const [payoutUpdated, setPayoutUpdated] = useState(false);

  const [cardType, setCardType] = useState('');
  const [cardInfo, setCardInfo] = useState<{
    number: string;
    expiration: string;
    cvv: string;
    name: string;
    address: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
    method: string;
    country?: CountrySelectValue;
  }>({
    number: '',
    expiration: '',
    cvv: '',
    name: '',
    address: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
    method: 'card',
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [confirmDeactivation, setConfirmDeactivation] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  const [analytics, setAnalytics] = useState({
    totalBooks: 0,
    qrScans: 0,
    totalRevenue: 0,
  });

  const [hostAnalytics, setHostAnalytics] = useState({
    totalBooks: 0,
    totalRevenue: 0,
  });  

  const personalInfoFAQ = [
    {
      question: 'Why should my username be unique?',
      answer:
        'Your username helps identify you on the platform. A unique name prevents confusion and ensures others can easily recognize and connect with you.',
    },
    {
      question: 'Why is my email address required?',
      answer:
        'Your email is used for account verification, important updates, and booking confirmations. Make sure it’s always valid and accessible.',
    },
    {
      question: 'Do I need to provide a phone number?',
      answer:
        'Phone number is optional. However, adding it can help in urgent communication between you and your host or guest, especially during travel.',
    },
    {
      question: 'Why should I provide a preferred contact method?',
      answer:
        'Choosing a preferred contact method helps us know how to best reach you, and ensures smoother communication between you, travelers, and hosts. Format e.g, Whatsapp: +1212 555 4567 / Telegram: @username',
    },
    {
      question: 'How can I update my legal name?',
      answer:
        'Click "Edit" next to Legal Name, make the necessary changes, and hit Save. Your legal name helps with billing and identity verification.',
    },
    {
      question: 'Why is my address important?',
      answer:
        'Your address is used for billing and helps speed up the checkout process. It also ensures that invoices and payout info are correctly generated.',
    },
  ];  

  const loginSecurityFAQ = [
    {
      question: 'How can I change my password?',
      answer:
        'Click "Update" next to Password. For security reasons, you’ll need to enter your current password, then your new password and confirm it. Note: Passwords are securely stored as encrypted hashes — meaning even we can’t see them.',
    },
    {
      question: 'What if I forgot my password?',
      answer:
        'No worries! Just click "Forgot password" on the login screen. We’ll send you a secure email link to reset your password.',
    },
    {
      question: 'Can I deactivate my account?',
      answer:
        'Yes, you can. Click "Deactivate" in the Account section. Please note: This action is permanent. Once confirmed, your account will be deactivated and removed from the platform — it cannot be undone.',
    },
  ];  

  const paymentsFAQ = [
    {
      question: 'How do I save my payment card?',
      answer:
        'Click "Add Card" to enter your billing details. Your card number is encrypted before being stored in our database, ensuring maximum security. If you prefer not to save it, you can enter it at checkout — it won’t be stored on our platform.',
    },
    {
      question: 'What withdrawal methods are supported?',
      answer:
        'We support Credit/Debit Cards, Revolut, IBAN, and PayPal for payouts. We only store the essential parts securely: card number for cards, IBAN credential for IBAN, and either username or phone number for PayPal.',
    },
    {
      question: 'When are payouts processed?',
      answer:
        'Payouts are processed twice a month. To ensure timely payments, make sure your withdrawal method is correctly added and up to date.',
    },
    {
      question: 'Can I delete my saved payment or withdrawal method?',
      answer:
        'Absolutely. You can delete your stored card or withdrawal method at any time and update it with new credentials as needed.',
    },
    {
      question: 'Are these settings relevant for travelers?',
      answer: 'Only the payment method section is relevant for travelers — it lets you store your card for faster checkout. The withdrawal section is only for hosts and promoters who receive payouts.',
    }    
  ];  

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await axios.get('/api/analytics/earnings');
        const daily = res.data.daily;
  
        const today = new Date().toISOString().split('T')[0];
        const todayEntry = daily.find((entry: { date: string }) => entry.date === today);
        const dailyProfit = todayEntry?.amount || 0;
  
        setEarnings({
          daily,
          monthly: res.data.monthly,
          yearly: res.data.yearly,
          dailyProfit,
          totalEarnings: res.data.totalEarnings,
        });
      } catch (err) {
        console.error("Earnings fetch failed:", err);
      }
    };
  
    if (['host', 'promoter'].includes(currentUser.role)) {
      fetchEarnings();
    }
  }, [currentUser.role]);  

  useEffect(() => {
    const fetchSavedCard = async () => {
      try {
        const res = await axios.get('/api/users/get-card');
        if (res.data) {
          setSavedCard(res.data);
          // console.log("Saved card", res.data);
        }
      } catch (err) {
        console.error('Failed to fetch saved card', err);
      }
    };
  
    fetchSavedCard();
  }, [cardUpdated]);  

  // useEffect(() => {
  //   const fetchAnalytics = async () => {
  //     const res = await axios.get('/api/analytics/get');
  //     setAnalytics(res.data);
  //   };
  //   fetchAnalytics();
  // }, []); 

  useEffect(() => {
    if (currentUser?.role !== 'promoter') return;

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/get', { timeout: 10000 });
        setAnalytics(res.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };
  
    // Call once immediately on mount
    fetchAnalytics();
  
    // Then set interval
    const interval = setInterval(fetchAnalytics, 20000); // ⏱️ every 20 seconds
  
    // Clear interval on unmount
    return () => clearInterval(interval);
  }, []);  

  useEffect(() => {
    const fetchUserCoupon = async () => {
      try {
        const res = await axios.get('/api/coupon/getusercoupon');
        const { code, used } = res.data;
  
        if (used) {
          setUserCoupon(null); // Do not show used coupons
        } else {
          setUserCoupon(code || null);
        }
      } catch (err) {
        console.error('Failed to fetch coupon:', err);
        setUserCoupon(null);
      }
    };
  
    if (currentUser?.role === 'customer') {
      fetchUserCoupon();
    }
  }, [currentUser]);  

  useEffect(() => {
    if (currentUser?.role !== 'host') return;
  
    const fetchHostAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/host/get', { timeout: 10000 });
        setHostAnalytics(res.data);
      } catch (error) {
        console.error('Error fetching host analytics:', error);
      }
    };
  
    fetchHostAnalytics();
    const interval = setInterval(fetchHostAnalytics, 20000);
  
    return () => clearInterval(interval);
  }, [currentUser]);  

  useEffect(() => {
    try {
      const parsedAddress = currentUser.address ? JSON.parse(currentUser.address) : {};
  
      setFieldValues({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        contact: currentUser.contact || '',
        legalName: currentUser.legalName || '',
        country: parsedAddress.country || null,
        street: parsedAddress.street || '',
        apt: parsedAddress.apt || '',
        city: parsedAddress.city || '',
        state: parsedAddress.state || '',
        zip: parsedAddress.zip || ''
      });
    } catch {
      // fallback in case of malformed address
    }
  }, [currentUser]);  

  useEffect(() => {
    const fetchPayoutMethod = async () => {
      try {
        const res = await axios.get('/api/users/get-payout-method');
        if (res.data) {
          setSavedPayout(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch withdrawal method', err);
      }
    };
  
    if (['promoter', 'host'].includes(currentUser?.role)) {
      fetchPayoutMethod();
    }
    // fetchPayoutMethod();
  }, [payoutUpdated]);

  useEffect(() => {
    if (['promoter', 'host'].includes(currentUser.role)) {
      setActivePaymentTab('payout');
    } else if (currentUser.role === 'customer') {
      setActivePaymentTab('payment');
    }
  }, [currentUser?.role]);  

  const handleSavePayoutMethod = async () => {
    try {
      const { method, number } = payoutInfo;
  
      if (!number) {
        // setPopupMessage('Please enter your withdraw details.');
        toast.error('Please enter your withdraw details.')
        return;
      }
  
      if (method === 'iban' && (!number.startsWith('IT') || number.replace(/\s/g, '').length !== 27)) {
        // setPopupMessage('IBAN must start with IT and be 27 characters.');
        toast.error('IBAN must start with IT and be 27 characters.')
        return;
      }
  
      await axios.post('/api/users/save-payout-method', {
        method,
        number, // ✅ Must match backend’s expected structure
      });
  
      // setPopupMessage('Withdraw method saved!');
      toast.success('Withdrawal method saved!', {
        iconTheme: {
            primary: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
            secondary: '#fff',
        }
      });
      
      setPayoutUpdated((prev) => !prev);
    } catch (err) {
      console.error('Failed to save withdrawal method', err);
      // setPopupMessage('Error saving withdraw method.');
      toast.error('Error saving withdrawal method.')
    }
  };  
  
  const handleDeletePayoutMethod = async () => {
    try {
      await axios.delete('/api/users/delete-payout-method');
      setSavedPayout(null);
      // setPopupMessage('Withdraw method deleted!');
      toast.success('Withdrawal method deleted!', {
        iconTheme: {
            primary: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
            secondary: '#fff',
        }
      });
    } catch (err) {
      console.error('Failed to delete withdrawal method', err);
      // setPopupMessage('Error deleting withdraw method.');
      toast.error('Error deleting withdrawal method.');
    }
  };  

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardInfo((prev) => ({ ...prev, [name]: value }));
  };

  const detectCardType = (number: string) => {
    const sanitized = number.replace(/\s+/g, '');
    const patterns: { [key: string]: RegExp } = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      americanexpress: /^3[47]/,
    };
  
    for (const type in patterns) {
      if (patterns[type].test(sanitized)) {
        return type;
      }
    }
    return 'card'; // default fallback
  };  

  const initials = currentUser.name?.[0]?.toUpperCase() || 'V';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSubmit = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;
    const croppedBase64 = await getCroppedImg(uploadedImage, croppedAreaPixels);
    setProfileImage(croppedBase64);
    setIsCropping(false);

    try {
      await axios.put('/api/users/profile-image', { image: croppedBase64 });
    } catch (err) {
      console.error("Image upload failed", err);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setUploadedImage(null);
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveField = async (key: string) => {
    try {
      let payload;
  
      if (key === 'address') {
        const { country, street, apt, city, state, zip } = fieldValues;
  
        payload = {
          address: JSON.stringify({
            country,
            street,
            apt,
            city,
            state,
            zip
          }),
        };
      } else {
        payload = {
          [key]: fieldValues[key as keyof typeof fieldValues]
        };
      }
  
      const res = await axios.put('/api/users/profile-info', payload);
  
      setFieldValues((prev) => ({
        ...prev,
        ...res.data,
        ...(res.data.address
          ? JSON.parse(res.data.address)
          : {})
      }));
  
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update field', err);
    }
  };  

  useEffect(() => {
    if (activeSection !== null) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection]);  

  return (
    <Container>
      <div className="pl-5">
      {/* <Heading title="Account" subtitle="" /> */}
      </div>

      {/* Avatar & name */}
      <div className="pl-5 pr-5 pb-6 rounded-xl border-b-[1px]">
        {/* Divider */}
        <div className="flex items-center gap-4 mt-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt="User"
                width={100}
                height={100}
                className="rounded-full object-cover shadow-xl hover:shadow-2xl"
              />
            ) : (
              <div className={twMerge(
                "w-[60px] h-[60px] rounded-full flex items-center justify-center text-white font-medium text-xl bg-black",
              )}
              // style={{
              //   background: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
              // }}
              >
                {initials}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* <div className="pt-1 text-normal">
                <p className="text-2xl font-semibold">{currentUser?.legalName || currentUser?.name || "Unnamed"}</p>
                <p className="text-md font-semibold">{currentUser?.email || ""}</p>
              </div> */}
              <div className="pt-1 text-normal">
                <p className="text-2xl font-semibold">
                  {currentUser?.legalName || currentUser?.name || "Unnamed"}
                </p>

                {/* <div className="flex items-center gap-3">
                  <p className="text-md font-semibold">{currentUser?.email || ""}</p>

                  {currentUser?.emailVerified ? (
                    <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-400 px-2 py-0.5 rounded-xl">
                      Verified
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        if (verifying) return;

                        setVerifying(true);
                        try {
                          await axios.post("/api/users/request-email-verification");
                          toast.success('Verification email sent!', {
                            iconTheme: {
                              primary: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
                              secondary: '#fff',
                            }
                          });
                        } catch (err: any) {
                          toast.error("Failed to send verification email.");
                        } finally {
                          setVerifying(false);
                        }
                      }}
                      disabled={verifying}
                      className={`text-sm font-medium border px-3 py-1.5 rounded-xl transition 
                        ${verifying ? 'bg-neutral-200 text-neutral-500 pointer-events-none' : 'text-blue-600 hover:bg-neutral-100'}
                      `}
                    >
                      {verifying ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Verify Email'
                      )}
                    </button>
                  )}
                </div> */}
                <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                  <p className="text-md font-semibold">{currentUser?.email || ""}</p>

                  <div className="mt-2 md:mt-0">
                    {currentUser?.emailVerified ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-400 px-2 py-0.5 rounded-xl">
                        Verified
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          if (verifying) return;

                          setVerifying(true);
                          try {
                            await axios.post("/api/users/request-email-verification");
                            toast.success('Verification email sent!', {
                              iconTheme: {
                                primary: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
                                secondary: '#fff',
                              }
                            });
                          } catch (err: any) {
                            toast.error("Failed to send verification email.");
                          } finally {
                            setVerifying(false);
                          }
                        }}
                        disabled={verifying}
                        className={`text-sm font-medium border px-3 py-1.5 rounded-xl transition 
                          ${verifying ? 'bg-neutral-200 text-neutral-500 pointer-events-none' : 'text-blue-600 hover:bg-neutral-100'}
                        `}
                      >
                        {verifying ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span>Sending...</span>
                          </div>
                        ) : (
                          'Verify Email'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
  
          {activeSection === 'personal-info' && (
            <>
            <div className="mt-8 pt-0 md:pt-5 w-full flex flex-col lg:flex-row items-start gap-10">
              <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-md hover:shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveSection(null)}
                      className="text-sm text-black hover:underline"
                    >
                      ←
                    </button>
                    <h2 className="text-md md:text-lg font-bold">Personal Area</h2>
                  </div>
                </div>

                <div className="space-y-6">
                {[
                  { label: 'Username', key: 'name' },
                  { label: 'Email address', key: 'email' },
                  { label: 'Phone number', key: 'phone' },
                  { label: 'Preferred contact method', key: 'contact' },
                  { label: 'Legal name', key: 'legalName' },
                  { label: 'Address', key: 'address' },
                ].map(({ label, key }) => (
                  <div key={key} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-neutral-500">{label}</p>

                      <AnimatePresence>
                      {editingField === key ? (
                        key === 'address' ? (
                          <>
                            <div className="space-y-4 pt-4">
                              <motion.div
                                  key="address-edit"
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={{ duration: 0.25 }}
                                  className="space-y-4 pt-4"
                                >
                              {/* CountrySelect */}
                              <CountrySelect
                                value={fieldValues.country ?? undefined}
                                onChange={(val) =>
                                  setFieldValues((prev) => ({
                                    ...prev,
                                    country: val,
                                  }))
                                }
                              />

                              {/* Address fields */}
                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="street"
                                  placeholder=" "
                                  value={fieldValues.street}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, street: e.target.value }))
                                  }
                                  className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="street"
                                  className={`
                                    absolute left-4 top-3 text-base text-neutral-500 transition-all
                                    duration-200 ease-in-out
                                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                                    peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                                    ${fieldValues.street ? 'top-2 text-sm text-black' : ''}
                                  `}
                                >
                                  Street address
                                </label>
                              </div>

                              {/* Apt */}
                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="apt"
                                  placeholder=" "
                                  value={fieldValues.apt}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, apt: e.target.value }))
                                  }
                                  className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="apt"
                                  className={`
                                    absolute left-4 top-3 text-base text-neutral-500 transition-all
                                    duration-200 ease-in-out
                                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                                    peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                                    ${fieldValues.apt ? 'top-2 text-sm text-black' : ''}
                                  `}
                                >
                                  Apt, suite, etc. (optional)
                                </label>
                              </div>

                              {/* City */}
                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="city"
                                  placeholder=" "
                                  value={fieldValues.city}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, city: e.target.value }))
                                  }
                                  className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="city"
                                  className={`
                                    absolute left-4 top-3 text-base text-neutral-500 transition-all
                                    duration-200 ease-in-out
                                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                                    peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                                    ${fieldValues.city ? 'top-2 text-sm text-black' : ''}
                                  `}
                                >
                                  City
                                </label>
                              </div>

                              {/* State */}
                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="state"
                                  placeholder=" "
                                  value={fieldValues.state}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, state: e.target.value }))
                                  }
                                  className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="state"
                                  className={`
                                    absolute left-4 top-3 text-base text-neutral-500 transition-all
                                    duration-200 ease-in-out
                                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                                    peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                                    ${fieldValues.state ? 'top-2 text-sm text-black' : ''}
                                  `}
                                >
                                  State / Province
                                </label>
                              </div>

                              {/* ZIP */}
                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="zip"
                                  placeholder=" "
                                  value={fieldValues.zip}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, zip: e.target.value }))
                                  }
                                  className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="zip"
                                  className={`
                                    absolute left-4 top-3 text-base text-neutral-500 transition-all
                                    duration-200 ease-in-out
                                    peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                                    peer-focus:top-2 peer-focus:text-sm peer-focus:text-black
                                    ${fieldValues.zip ? 'top-2 text-sm text-black' : ''}
                                  `}
                                >
                                  ZIP Code
                                </label>
                              </div>


                              <button
                                onClick={() => handleSaveField(key)}
                                className="w-full text-sm text-white bg-black hover:bg-neutral-800 px-4 py-4 rounded-xl transition"
                              >
                                Save
                              </button>
                              </motion.div>
                            </div>
                          </>
                        ) : (
                          <>
                          <motion.div
                            key="address-edit"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-4 pt-4"
                          >
                            <input
                              type="text"
                              className="mt-2 text-base border rounded-xl p-4 w-full"
                              value={
                                typeof fieldValues[key as keyof typeof fieldValues] === 'string'
                                  ? (fieldValues[key as keyof typeof fieldValues] as string)
                                  : ''
                              }
                              onChange={(e) =>
                                setFieldValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                            />
                            <button
                              onClick={() => handleSaveField(key)}
                              className="mt-3 text-sm text-white bg-black hover:bg-neutral-800 px-4 py-2 rounded-xl transition"
                            >
                              Apply
                            </button>
                            </motion.div>
                          </>
                        )
                      ) : (
                        <motion.div
                          key="address-edit"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-4 pt-4"
                        >
                        <div className="text-lg font-medium break-words">
                          {key === 'address' ? (
                            fieldValues.country || fieldValues.street || fieldValues.city || fieldValues.state || fieldValues.zip ? (
                              <div className="text-md text-neutral-800 space-y-1">
                                {fieldValues.country && (
                                  <div className="flex items-center gap-2">
                                    <Image
                                      src={`/flags/${fieldValues.country.value?.split('-').pop()?.toLowerCase()}.svg`}
                                      alt={fieldValues.country.label}
                                      width={24}
                                      height={16}
                                      className="rounded-full object-cover"
                                    />
                                    <span>{fieldValues.country.city ? `${fieldValues.country.city}, ` : ''}{fieldValues.country.label}</span>
                                  </div>
                                )}
                                {fieldValues.street && <div>{fieldValues.street}</div>}
                                {fieldValues.apt && <div>{fieldValues.apt}</div>}
                                {/* {fieldValues.city && <div>{fieldValues.city}</div>} */}
                                {fieldValues.state && <div>{fieldValues.state}</div>}
                                {fieldValues.zip && <div>{fieldValues.zip}</div>}
                              </div>
                            ) : (
                              <p className="text-md text-neutral-800">Not provided</p>
                            )
                          ) : (
                            <p className="text-md text-neutral-800">
                            {typeof fieldValues[key as keyof typeof fieldValues] === 'string' &&
                            (fieldValues[key as keyof typeof fieldValues] as string).trim()
                              ? (fieldValues[key as keyof typeof fieldValues] as string)
                              : 'Not provided'}
                          </p>
                          )}
                        </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>
                    <button
                      onClick={() => setEditingField(editingField === key ? null : key)}
                      className="text-sm text-black border-b border-black hover:opacity-80 ml-2 whitespace-nowrap"
                    >
                      {key === 'address'
                        ? (
                            fieldValues.street ||
                            fieldValues.apt ||
                            fieldValues.city ||
                            fieldValues.state ||
                            fieldValues.zip ||
                            fieldValues.country
                          )
                          ? editingField === key
                            ? 'Cancel'
                            : 'Edit'
                          : 'Add'
                        : fieldValues[key as keyof typeof fieldValues]
                          ? editingField === key
                            ? 'Cancel'
                            : 'Edit'
                          : 'Add'}

                    </button>
                  </div>
                ))}
              </div>

              </div>
              {/* Right: FAQ Block */}
              <div className="w-full lg:w-1/2 lg:sticky lg:top-36 px-5 md:px-20">
                <FAQ items={personalInfoFAQ} />
              </div>
              </div>
            </>
          )}

          {activeSection === 'login-security' && (
              <div className="mt-8 pt-0 md:pt-5 w-full flex flex-col lg:flex-row items-start gap-10">
              {/* Left: Login & Security */}
              <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-md hover:shadow-lg p-6 mt-0 md:mt-9">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveSection(null)}
                      className="text-sm text-black hover:underline"
                    >
                      ←
                    </button>
                    <h2 className="text-md md:text-lg font-bold">Login & Security</h2>
                  </div>
                </div>

              {/* Password Update */}
              <div className="space-y-2 mb-10">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-neutral-500">Password</p>
                  <button
                    onClick={() => setEditingField(editingField === 'password' ? null : 'password')}
                    className="text-sm text-black border-b border-black hover:opacity-80 ml-2"
                  >
                    {editingField === 'password' ? 'Cancel' : 'Update'}
                  </button>
                </div>
                <p className="text-xs text-neutral-400">Last updated: {new Date(currentUser.updatedAt).toLocaleDateString()}</p>

                <AnimatePresence>
                  {editingField === 'password' && (
                    <motion.div
                      key="password-edit"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4 pt-4"
                    >
                      <input
                        type="password"
                        placeholder="Current password"
                        className="w-full border-b p-2 outline-none"
                        id="currentPassword"
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        className="w-full border-b p-2 outline-none"
                        id="newPassword"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full border-b p-2 outline-none"
                        id="confirmNewPassword"
                      />
                      <button
                        onClick={async () => {
                          const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
                          const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
                          const confirmNewPassword = (document.getElementById('confirmNewPassword') as HTMLInputElement).value;

                          if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
                            toast.error('Please check your input fields.');
                            return;
                          }

                          try {
                            await axios.put('/api/users/update-password', {
                              currentPassword,
                              newPassword,
                              confirmPassword: confirmNewPassword
                            });
                            toast.success('Password updated successfully!', {
                              iconTheme: {
                                primary: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
                                secondary: '#fff',
                              }
                            });
                            setEditingField(null);
                          } catch (err) {
                            toast.error('Failed to update password. Check current password.');
                          }
                        }}
                        className="text-sm text-white bg-[#000] hover:bg-neutral-800 p-2 rounded-lg"
                      >
                        Update Password
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
              </div>

              {/* Account Deactivation */}
              <div className="space-y-2">
                <p className="text-sm text-neutral-500">Account</p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">Deactivate your account</p>
                  <button
                    onClick={() => setConfirmDeactivation(true)}
                    className="text-sm text-black border-b border-black hover:opacity-80"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
            {/* Right: FAQ */}
              <div className="w-full lg:w-1/2 lg:sticky lg:top-36 px-5 md:px-20">
                <FAQ items={loginSecurityFAQ} />
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <>
            <div className="mt-8 pt-0 md:pt-5 flex flex-col lg:flex-row gap-10 w-full items-start">
              <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-md hover:shadow-lg p-6">

              {/* Header */}
                <div className="flex justify-between items-center mb-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="text-sm text-black hover:underline"
                  >
                    ←
                  </button>
                  <h2 className="text-md md:text-lg font-bold">Payments & Withdrawal</h2>
                </div>
              </div>
                {/* Tabs */}
                {currentUser.role === 'promoter' && (
                <div className="flex gap-4 mb-6">
                  {/* <button
                    className={`px-4 py-2 rounded-lg ${activePaymentTab === 'payout' ? 'bg-black text-white' : 'border'}`}
                    onClick={() => setActivePaymentTab('payout')}
                  >
                    Payout
                  </button> */}
                </div>
                )}

                {/* Tabs */}
                {currentUser.role === 'customer' && (
                <div className="flex gap-4 mb-6">
                  {/* <button
                    className={`px-4 py-2 rounded-lg ${activePaymentTab === 'payment' ? 'bg-black text-white' : 'border'}`}
                    onClick={() => setActivePaymentTab('payment')}
                  >
                    Payment
                  </button> */}
                </div>
                )}

                {activePaymentTab === 'payment' && currentUser.role === 'customer' && (
                  <>
                    <Heading title="Payment Method" subtitle="Manage your cards and payment methods" />
                    {!savedCard ? (
                      <button
                        className="mt-4 px-4 border py-2 bg-black text-white transition hover:bg-neutral-800 rounded-lg"
                        onClick={() => setShowCardModal(true)}
                      >
                        Add Card
                      </button>
                    ) : (
                      <div className="flex gap-4 mt-4">
                      {/* Edit Button */}
                      <button
                        className="px-4 py-2 shadow-sm hover:shadow-md text-black rounded-lg hover:bg-neutral-100 transition"
                        onClick={() => setShowCardModal(true)}
                      >
                        Edit Card
                      </button>

                      {/* Delete Button */}
                      <button
                        className="px-4 py-2 shadow-sm hover:shadow-md text-black rounded-xl hover:bg-black hover:text-white transition"
                        onClick={() => setShowConfirmDelete(true)}
                      >
                        Delete Card
                      </button>
                    </div>
                    )}

                    {savedCard && (
                    <div
                      className="relative w-full max-w-sm h-56 perspective mt-6"
                      onClick={() => setIsFlipped(prev => !prev)}
                    >
                      <div
                        className={`absolute w-full h-full sm:h-full h-[90%] duration-700 transform transition-transform preserve-3d ${
                          isFlipped ? 'rotate-y-180' : ''
                        }`}
                        >
                        {/* FRONT SIDE */}
                        {/* <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                          <p className="text-lg font-semibold tracking-widest">Payment Card</p>
                        </div> */}
                        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                          <Image
                            src={
                              savedCard?.number?.replace(/\D/g, '').startsWith('4')
                                ? '/images/Visa.png'
                                : savedCard?.number?.replace(/\D/g, '').startsWith('5')
                                ? '/images/MasterCard.png'
                                : savedCard?.number?.replace(/\D/g, '').startsWith('3')
                                ? '/images/americanexpress.png'
                                // : savedCard?.number?.replace(/\D/g, '').startsWith('6')
                                // ? '/images/Discover.png'
                                : '/images/card.png'
                            }
                            alt="Card Type"
                            className="w-24 h-auto object-contain"
                            width={64}
                            height={32}
                          />
                        </div>


                        {/* BACK SIDE */}
                        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-between">
                          <div className="text-sm tracking-wider text-gray-400">Encrypted</div>

                          <div className="text-xl font-mono tracking-widest text-center my-4">
                            **** **** **** {savedCard.number.slice(-4)}
                          </div>

                          <div className="flex justify-between text-sm tracking-wider">
                            <div>
                              <p className="text-gray-400">Exp</p>
                              <p className="font-semibold">**/*{savedCard.expiration?.slice(-1)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">CVV</p>
                              <p className="font-semibold">{savedCard.cvv?.[0]}**</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                    <div className="mt-10">
                      <Heading
                        title="Voucher"
                        subtitle=""
                      />
                    {userCoupon && 
                      <p className="mt-2 text-lg text-neutral-700 gap-2">
                          Active coupon:{' '}
                          <span className="inline-block px-3 py-1 border border-dashed border-black rounded-lg bg-neutral-50">
                            {userCoupon}
                          </span>
                        </p>
                      }

                  <AnimatePresence mode="wait">
                    {showCouponInput ? (
                      <motion.div
                        key="couponInput"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="mt-4"
                      >
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter your coupon code"
                          className="w-full shadow-md p-2 rounded-lg"
                        />
                        <div className="flex gap-2 mt-5">
                          <button
                            className="bg-black text-white px-4 py-1 rounded-lg hover:bg-neutral-800 transition"
                            onClick={async () => {
                              if (!couponCode) return toast.error('Enter a coupon code');
                              try {
                                const res = await axios.post('/api/coupon/addcoupon', { code: couponCode });
                                toast.success(`Coupon "${couponCode}" applied!`);
                                setCouponCode('');
                                setShowCouponInput(false);
                                setUserCoupon(couponCode);
                              } catch (err: any) {
                                // toast.error(err?.response?.data || 'Coupon invalid or expired');
                                const errorMsg = err?.response?.data;
                                toast.error(typeof errorMsg === 'string' ? errorMsg : errorMsg?.error || 'Coupon invalid or expired');
                              }
                            }}
                          >
                            Apply
                          </button>
                          <button
                            className="border px-4 py-1 rounded-lg hover:bg-neutral-100 hover:text-black transition"
                            onClick={() => setShowCouponInput(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="addCouponBtn"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 text-sm underline text-black"
                        onClick={() => setShowCouponInput(true)}
                      >
                        {userCoupon ? 'Edit Coupon' : 'Add Coupon'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                    </div>

                  </>
                )}

                {activePaymentTab === 'payout' && ['promoter', 'host'].includes(currentUser.role) && (
                  <>
                  <div className="pt-4">
                    <Heading title="Withdrawal Method" subtitle="Manage your withdrawal credentials" />
                    </div>

                    {savedPayout ? (
                      <>
                        {/* Flip Card */}
                        <div
                          className="relative w-full max-w-sm h-56 perspective mt-6 cursor-pointer"
                          onClick={() => setIsFlipped(prev => !prev)}
                        >
                          <div
                            className={`absolute w-full h-full sm:h-full h-[90%] duration-700 transform transition-transform preserve-3d ${
                              isFlipped ? 'rotate-y-180' : ''
                            }`}
                            >
                            {/* FRONT */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                              {/* <p className="text-lg font-bold tracking-widest uppercase border-b border-white">
                                {savedPayout.method}
                              </p> */}
                              <Image
                                  src={
                                    savedPayout.method === 'paypal'
                                      ? '/images/paypal.png'
                                      : savedPayout.method === 'iban'
                                      ? '/images/iban.png'
                                      : savedPayout.method === 'revolut'
                                      ? '/images/revolut.png'
                                      : savedPayout.method === 'card' &&
                                        savedPayout.number?.replace(/\D/g, '').startsWith('4')
                                      ? '/images/Visa.png'
                                      : savedPayout.method === 'card' &&
                                        savedPayout.number?.replace(/\D/g, '').startsWith('5')
                                      ? '/images/MasterCard.png'
                                      : savedPayout.method === 'card' &&
                                        savedPayout.number?.replace(/\D/g, '').startsWith('3')
                                      ? '/images/americanexpress.png'
                                      // : savedPayout.method === 'card' &&
                                      //   savedPayout.number?.replace(/\D/g, '').startsWith('6')
                                      // ? '/images/Discover.png'
                                      : '/images/card.png'
                                  }
                                  alt={savedPayout.method}
                                  className="w-24 h-auto object-contain"
                                  width={64}
                                  height={32}
                                />
                            </div>

                            {/* BACK SIDE */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-center items-center gap-4">
                              <p className="text-xs tracking-wider text-gray-400">Credential</p>
                              <p className="text-lg font-mono text-center">
                                {savedPayout.method === 'paypal'
                                  ? savedPayout.number
                                  : savedPayout.number && savedPayout.number.length >= 8
                                  ? `${savedPayout.number.slice(0, 4)} ${'*'.repeat(8)} ${savedPayout.number.slice(-4)}`
                                  : '****'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Delete Button Only */}
                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={() => setShowConfirmDeletePayout(true)}
                            className="border px-4 py-2 rounded-lg hover:bg-black hover:text-white transition"
                          >
                            Delete Method
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Select Method */}
                        <div className="mt-4">
                          <label className="block mb-2 font-semibold">Withdrawal Method</label>
                          <select
                            value={payoutInfo.method}
                            onChange={(e) => setPayoutInfo({ ...payoutInfo, method: e.target.value })}
                            className="w-full border border-neutral-300 rounded-md px-4 py-3"
                          >
                            <option value="card">Credit/Debit Card</option>
                            <option value="iban">IBAN</option>
                            <option value="revolut">Revolut</option>
                            <option value="paypal">PayPal</option>
                          </select>
                        </div>

                        {/* Input with Animated Label & Icon */}
                        <div className="relative w-full mt-6">
                        <input
                            value={payoutInfo.number}
                            onChange={(e) => {
                              let val = e.target.value;

                              // format for card/revolut
                              if (['card', 'revolut'].includes(payoutInfo.method)) {
                                val = val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
                              }

                              // format for iban
                              if (payoutInfo.method === 'iban') {
                                val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 27);
                              }

                              setPayoutInfo({ ...payoutInfo, number: val });
                            }}
                            className="peer w-full border border-neutral-300 rounded-lg px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black pr-14"
                          />

                          <label
                            htmlFor="payoutInput"
                            className="absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                              peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                              peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                          >
                            {payoutInfo.method === 'iban'
                              ? 'IBAN (Starts with IT)'
                              : payoutInfo.method === 'paypal'
                              ? 'PayPal username or phone'
                              : payoutInfo.method === 'revolut'
                              ? 'Revolut 16-digit number'
                              : 'Card number'}
                          </label>

                          {/* Right-side Logo */}
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Image
                              src={
                                payoutInfo.method === 'paypal'
                                  ? '/images/paypal.png'
                                  : payoutInfo.method === 'iban'
                                  ? '/images/iban.png'
                                  : payoutInfo.method === 'revolut'
                                  ? '/images/revolut.png'
                                  : payoutInfo.number.replace(/\D/g, '').startsWith('4')
                                  ? '/images/Visa.png'
                                  : payoutInfo.number.replace(/\D/g, '').startsWith('5')
                                  ? '/images/MasterCard.png'
                                  : payoutInfo.number.replace(/\D/g, '').startsWith('3')
                                  ? '/images/americanexpress.png'
                                  : '/images/card4.png'
                              }
                              alt="Method"
                              className="w-8 h-5 object-contain"
                              width={50}
                              height={50}
                            />
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={handleSavePayoutMethod}
                            className="bg-black text-white px-4 py-2 rounded-lg"
                          >
                            Save Payout
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="w-full lg:w-1/2 lg:sticky lg:top-32 px-5 md:px-20 mt-0 md:mt-5">
                <FAQ items={paymentsFAQ} />
              </div>
            </div>
            </>
          )}

          {showConfirmDeletePayout && (
            <ConfirmPopup
              title="Delete Withdrawal Method"
              message="Are you sure you want to delete your withdrawal method?"
              onCancel={() => setShowConfirmDeletePayout(false)}
              onConfirm={async () => {
                try {
                  await handleDeletePayoutMethod();
                } finally {
                  setShowConfirmDeletePayout(false);
                }
              }}
            />
          )}

          {showConfirmDelete && (
            <ConfirmPopup
              title="Delete Card"
              message="Are you sure you want to delete your saved card?"
              onCancel={() => setShowConfirmDelete(false)}
              onConfirm={async () => {
                try {
                  await axios.delete('/api/users/delete-card');
                  setSavedCard(null);
                  setShowConfirmDelete(false);
                } catch (err) {
                  console.error('Failed to delete card', err);
                  setShowConfirmDelete(false);
                }
              }}
            />
          )}

          {popupMessage && (
            <ConfirmPopup
              title="Notice"
              message={popupMessage}
              hideCancel
              confirmLabel="OK"
              onConfirm={() => setPopupMessage(null)}
            />
          )}

          {popupMessage && (
            <ConfirmPopup
              title="Notice"
              message={popupMessage}
              hideCancel
              confirmLabel="OK"
              onConfirm={() => setPopupMessage(null)}
            />
          )}

          {confirmDeactivation && (
            <ConfirmPopup
              title="Confirm Deactivation"
              message="Are you sure you want to deactivate your account? This action is irreversible."
              confirmLabel="Yes, Deactivate"
              cancelLabel="Cancel"
              onConfirm={async () => {
                try {
                  await axios.delete('/api/users/deactivate');
                  window.location.href = '/'; // Redirect after deactivation
                } catch (err) {
                  // setPopupMessage('Failed to deactivate account.');
                  toast.error('Failed to deactivate account.');
                } finally {
                  setConfirmDeactivation(false);
                }
              }}
              onCancel={() => setConfirmDeactivation(false)}
            />
          )}

          {popupMessage && (
            <ConfirmPopup
              title="Notice"
              message={popupMessage}
              hideCancel
              confirmLabel="OK"
              onConfirm={() => setPopupMessage(null)}
            />
          )}

      <AnimatedModal isOpen={showCardModal} onClose={() => setShowCardModal(false)}>
      <div className="flex flex-col max-h-[60vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Card Details</h3>
          <button onClick={() => setShowCardModal(false)} className="text-sm">✕</button>
        </div>

          {cardInfo.method === 'card' && (
            <>
              <div className="flex flex-row gap-1 items-center">
                <Image width={50} height={50} src="/images/Visa.png" alt="Visa" className="w-10" />
                <Image width={50} height={50} src="/images/MasterCard.png" alt="MasterCard" className="w-8" />
                <Image width={50} height={50} src="/images/americanexpress.png" alt="AMEX" className="w-6" />
              </div>

                <div className="overflow-y-auto mt-2 mb-4 space-y-4 h-[40vh] sm:h-[20vh] md:h-auto">
                  {/* Card Number with floating label */}
                  <div className="relative w-full mb-4 px-1 pt-1">
                    <input
                      type="text"
                      id="cardNumber"
                      name="number"
                      placeholder=" "
                      value={cardInfo.number}
                      onChange={(e) => {
                        const formatted = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 16)
                          .replace(/(.{4})/g, '$1 ')
                          .trim();
                        setCardInfo({ ...cardInfo, number: formatted });
                        setCardType(detectCardType(formatted));
                      }}
                      className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black pr-14"
                    />
                    <label
                      htmlFor="cardNumber"
                      className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                        duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                        peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                    >
                      Card number
                    </label>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Image
                        src={
                          cardInfo.number.trim() === ''
                            ? '/images/card4.png'
                            : `/images/${cardType || 'card'}.png`
                        }
                        alt="Card Type"
                        className="w-8 h-5 object-contain"
                        width={50}
                        height={50}
                      />
                    </div>
                  </div>

                  {/* Expiration & CVV */}
                  <div className="flex gap-4 mb-4">
                    <div className="relative w-1/2 px-1">
                      <input
                        type="text"
                        name="expiration"
                        id="cardExpiration"
                        placeholder=" "
                        value={cardInfo.expiration}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2)}`;
                          setCardInfo({ ...cardInfo, expiration: val });
                        }}
                        className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <label
                        htmlFor="cardExpiration"
                        className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                          duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                          peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                      >
                        (MM/YY)
                      </label>
                    </div>

                    <div className="relative w-1/2 px-1">
                      <input
                        type="text"
                        name="cvv"
                        id="cardCVV"
                        placeholder=" "
                        value={cardInfo.cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setCardInfo({ ...cardInfo, cvv: val });
                        }}
                        className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <label
                        htmlFor="cardCVV"
                        className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                          duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                          peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                      >
                        CVV
                      </label>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-4 mb-4">
                    <h3 className="text-md font-semibold ml-2">Billing Address</h3>

                    {[
                      { name: 'address', label: 'Street address' },
                      { name: 'apt', label: 'Apt or suite number' },
                      { name: 'city', label: 'City' },
                      { name: 'state', label: 'State' },
                      { name: 'zip', label: 'ZIP Code' }
                    ].map(({ name, label }) => (
                      <div key={name} className="relative w-full px-1">
                        <input
                          type="text"
                          name={name}
                          id={`billing-${name}`}
                          placeholder=" "
                          value={cardInfo[name as keyof typeof cardInfo] as string}
                          onChange={handleCardChange}
                          className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <label
                          htmlFor={`billing-${name}`}
                          className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                            duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                            peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                        >
                          {label}
                        </label>
                      </div>
                    ))}

                    <div className="px-1">
                      <CountrySelect
                        value={cardInfo.country}
                        onChange={(value) => setCardInfo({ ...cardInfo, country: value })}
                      />
                    </div>
                  </div>
                  </div>

                  <button
                    className="bg-black text-white px-4 py-3 rounded-xl w-full hover:bg-neutral-800 transition"
                    onClick={async () => {
                      try {
                        if (savedCard) {
                          await axios.delete('/api/users/delete-card');
                        }

                        const payload = { ...cardInfo };
                        await axios.post('/api/users/save-card', payload);
                        setCardUpdated(prev => !prev);
                        setShowCardModal(false);

                        // Immediately sync card address to user's profile address
                        await axios.put('/api/users/profile-info', {
                          address: JSON.stringify({
                            street: cardInfo.address,
                            apt: cardInfo.apt,
                            city: cardInfo.city,
                            state: cardInfo.state,
                            zip: cardInfo.zip,
                            country: cardInfo.country,
                          }),
                        });

                        const cardRes = await axios.get('/api/users/get-card');
                        const CARD_SECRET_KEY = process.env.CARD_SECRET_KEY || '';
                        const decrypt = (text: string) =>
                          CryptoJS.AES.decrypt(text, CARD_SECRET_KEY).toString(CryptoJS.enc.Utf8);

                        setSavedCard({
                          number: decrypt(cardRes.data.number),
                          expiration: decrypt(cardRes.data.expiration),
                          cvv: decrypt(cardRes.data.cvv),
                          name: decrypt(cardRes.data.name),
                        });

                        // setPopupMessage('Card saved successfully!');
                        toast.success('Card saved successfully!', {
                          iconTheme: {
                              primary: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #6adcff, #ffffff)',
                              secondary: '#fff',
                          }
                        });
                      } catch (err) {
                        console.error(err);
                        // setPopupMessage('Failed to save card. Please try again.');
                        toast.error('Failed to save card. Please try again.');
                      }
                    }}
                  >
                    Save Card
                  </button>
                </>
              )}
            </div>
        </AnimatedModal>
  
      {/* ✅ SECTION: DEFAULT OVERVIEW */}
      {!activeSection && (
        <>
  
          {/* Account Blocks */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveSection('personal-info')}
              className="cursor-pointer p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <div className="text-4xl text-[#000] mb-4"><CgUserlane /></div>
              <p className="text-lg font-semibold">Personal Info</p>
              <p className="text-sm text-neutral-600">Edit your name, phone number, and more</p>
            </div>
  
            <div
              onClick={() => setActiveSection('login-security')}
              className="cursor-pointer p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <div className="text-4xl text-[#000] mb-4"><MdOutlineSecurity /></div>
              <p className="text-lg font-semibold">Login & Security</p>
              <p className="text-sm text-neutral-600">Manage your password and account access</p>
            </div>
  
            <div
              onClick={() => setActiveSection('payments')}
              className="cursor-pointer p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <div className="text-4xl text-[#000] mb-4"><RiSecurePaymentLine /></div>
              <p className="text-lg font-semibold">Payments & Withdrawal</p>
              <p className="text-sm text-neutral-600">View and update your withdrawal methods</p>
            </div>
          </div>
        </>
      )}

      {/* Promoter Stats */}
      {currentUser.role === 'promoter' && !activeSection && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Referral Activities */}
              <div className="p-6 rounded-xl shadow-md hover:shadow-lg">
                <p className="text-lg font-semibold mb-2">Referral Activities</p>
                <p className="text-sm text-neutral-600 mb-4">
                  Performance and Earnings overview — renewed twice a month.
                </p>

                <div className="space-y-4 p-5">
                  <div className="flex justify-between items-center shadow-md rounded-xl p-4 text-lg text-neutral-800 hover:shadow-sm transition">
                    <span className="font-medium">Total Books</span>
                    <span className="font-semibold text-black">{analytics.totalBooks}</span>
                  </div>

                  <div className="flex justify-between items-center shadow-md rounded-xl p-4 text-lg text-neutral-800 hover:shadow-sm transition">
                    <span className="font-medium">QR Code Scanned</span>
                    <span className="font-semibold text-black">{analytics.qrScans}</span> {/* Update dynamically */}
                  </div>

                  <div className="flex justify-between items-center shadow-md rounded-xl p-4 text-lg text-neutral-800 hover:shadow-sm transition">
                    <span className="font-medium">Total Books Revenue</span>
                    <span className="font-semibold text-black">{formatCurrency(analytics.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Total Earned */}
              <div className="p-6 rounded-xl shadow-md hover:shadow-lg flex flex-col">
                <p className="text-lg font-semibold mb-2">Pre-Withdrawal Revenue</p>
                <p className="text-sm text-neutral-600 mb-4">
                  Earning 10% from each referral booking made through your code.
                </p>
                <div className="rounded-xl p-10 pl-8 pr-8 flex justify-center md:items-center md:h-52 hover:shadow-sm">
                  <p className="text-3xl text-black font-semibold">
                    {formatCurrency((analytics.totalRevenue || 0) * 0.10)}
                  </p>
                </div>
              </div>

              {/* Withdraw Details */}
              <div className="p-6 rounded-xl shadow-md hover:shadow-lg">
                <p className="text-lg font-semibold mb-2">Withdrawal Method</p>
                <p className="text-sm text-neutral-600 mb-4">Deposits processed twice per month.</p>

                {savedPayout ? (
                  <div
                    className="relative w-full max-w-sm h-56 perspective"
                    onClick={() => setIsFlipped(prev => !prev)}
                  >
                    <div
                      className={`absolute w-full h-full sm:h-full h-[90%] duration-700 transform transition-transform preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                      >
                      {/* FRONT SIDE */}
                      {/* <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                        <p className="text-lg font-bold tracking-widest uppercase border-b border-white">
                          {savedPayout.method}
                        </p>
                      </div> */}
                      <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                        <Image
                          src={
                            savedPayout.method === 'paypal'
                              ? '/images/paypal.png'
                              : savedPayout.method === 'iban'
                              ? '/images/iban.png'
                              : savedPayout.method === 'revolut'
                              ? '/images/revolut.png'
                              : savedPayout.method === 'card' &&
                                savedPayout.number?.replace(/\D/g, '').startsWith('4')
                              ? '/images/Visa.png'
                              : savedPayout.method === 'card' &&
                                savedPayout.number?.replace(/\D/g, '').startsWith('5')
                              ? '/images/MasterCard.png'
                              : savedPayout.method === 'card' &&
                                savedPayout.number?.replace(/\D/g, '').startsWith('3')
                              ? '/images/americanexpress.png'
                              // : savedPayout.method === 'card' &&
                              //   savedPayout.number?.replace(/\D/g, '').startsWith('6')
                              // ? '/images/Discover.png'
                              : '/images/card.png'
                          }
                          alt={savedPayout.method}
                          className="w-24 h-auto object-contain"
                          width={64}
                          height={32}
                        />
                      </div>


                      {/* BACK SIDE */}
                      <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-center items-center gap-4">
                        <p className="text-xs tracking-wider text-gray-400">Credentials</p>
                        <p className="text-lg font-mono text-center">
                          {savedPayout.method === 'paypal'
                            ? savedPayout.number
                            : savedPayout.number && savedPayout.number.length >= 8
                            ? `${savedPayout.number.slice(0, 4)} ${'*'.repeat(8)} ${savedPayout.number.slice(-4)}`
                            : '****'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-100 p-4 rounded-xl flex items-center justify-between">
                    <p className="text-sm text-neutral-600">Withdrawmethod is not provided</p>
                    <button
                      onClick={() => {
                        setActiveSection('payments');
                        setActivePaymentTab('payout');
                        const section = document.getElementById('payments-section');
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-sm underline text-black ml-4"
                    >
                      Go to Withdraw
                    </button>
                  </div>
                )}
              </div>

            </div>
      )}

      {/* Host Stats */}
      {currentUser.role === 'host' && !activeSection && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Reservation Activities */}
          <div className="p-6 rounded-xl shadow-md hover:shadow-lg">
            <p className="text-lg font-semibold mb-2">Booking Activity</p>
            <p className="text-sm text-neutral-600 mb-4">
              Earnings and Bookings overview — renewed twice a month.
            </p>

            <div className="space-y-4 p-5">
              <div className="flex justify-between items-center shadow-md rounded-xl p-4 text-lg text-neutral-800 hover:shadow-sm transition">
                <span className="font-medium">Total Bookings</span>
                <span className="font-semibold text-black">{hostAnalytics.totalBooks}</span>
              </div>

              <div className="flex justify-between items-center shadow-md rounded-xl p-4 text-lg text-neutral-800 hover:shadow-sm transition">
                <span className="font-medium">Total Revenue</span>
                <span className="font-semibold text-black">{formatCurrency(hostAnalytics.totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Host Total Earned */}
          <div className="p-6 rounded-xl shadow-md hover:shadow-lg flex flex-col">
            <p className="text-lg font-semibold mb-2">Pre-Withdrawal Revenue</p>
            <p className="text-sm text-neutral-600 mb-4">
              As a host, you earn 90% of your listing revenue.
            </p>
            <div className="rounded-xl p-10 pl-8 pr-8 flex justify-center md:items-center md:h-52 hover:shadow-sm">
              <p className="text-3xl text-black font-semibold">
                {formatCurrency((hostAnalytics.totalRevenue || 0) * 0.90)}
              </p>
            </div>
          </div>

          {/* Withdraw Method */}
          <div className="p-6 rounded-xl shadow-md hover:shadow-lg">
            <p className="text-lg font-semibold mb-2">Withdrawal Method</p>
            <p className="text-sm text-neutral-600 mb-4">Deposits processed twice per month.</p>

            {savedPayout ? (
              <div
                className="relative w-full max-w-sm h-56 perspective"
                onClick={() => setIsFlipped(prev => !prev)}
              >
                <div
                  className={`absolute w-full h-full sm:h-full h-[90%] duration-700 transform transition-transform preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT SIDE */}
                  <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                    <Image
                      src={
                        savedPayout.method === 'paypal'
                          ? '/images/paypal.png'
                          : savedPayout.method === 'iban'
                          ? '/images/iban.png'
                          : savedPayout.method === 'revolut'
                          ? '/images/revolut.png'
                          : savedPayout.method === 'card' &&
                            savedPayout.number?.replace(/\D/g, '').startsWith('4')
                          ? '/images/Visa.png'
                          : savedPayout.method === 'card' &&
                            savedPayout.number?.replace(/\D/g, '').startsWith('5')
                          ? '/images/MasterCard.png'
                          : savedPayout.method === 'card' &&
                            savedPayout.number?.replace(/\D/g, '').startsWith('3')
                          ? '/images/americanexpress.png'
                          // : savedPayout.method === 'card' &&
                          //   savedPayout.number?.replace(/\D/g, '').startsWith('6')
                          // ? '/images/Discover.png'
                          : '/images/card.png'
                      }
                      alt={savedPayout.method}
                      className="w-24 h-auto object-contain"
                      width={64}
                      height={32}
                    />
                  </div>

                  {/* BACK SIDE */}
                  <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-center items-center gap-4">
                    <p className="text-xs tracking-wider text-gray-400">Credentials</p>
                    <p className="text-lg font-mono text-center">
                      {savedPayout.method === 'paypal'
                        ? savedPayout.number
                        : savedPayout.number && savedPayout.number.length >= 8
                        ? `${savedPayout.number.slice(0, 4)} ${'*'.repeat(8)} ${savedPayout.number.slice(-4)}`
                        : '****'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-100 p-4 rounded-xl flex items-center justify-between">
                <p className="text-sm text-neutral-600">Withdrawal method is not provided</p>
                <button
                  onClick={() => {
                    setActiveSection('payments');
                    setActivePaymentTab('payout');
                    const section = document.getElementById('payments-section');
                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm underline text-black ml-4"
                >
                  Go to Withdraw
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {(currentUser.role === 'host' || currentUser.role === 'promoter') && !activeSection && (
        <>
        <div className="mt-10">
          <EarningsCard
            title="What You’ve Achieved"
            roleLabel={currentUser.role === 'host' ? 'Host' : 'Promoter'}
            dailyData={earnings.daily}
            monthlyData={earnings.monthly}
            yearlyData={earnings.yearly}
            totalEarnings={earnings.totalEarnings}
          />
        </div>
        </>
      )}
  
      {/* Crop Modal */}
      {isCropping && uploadedImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-[90vw] h-[70vh] relative rounded-xl shadow-lg">
            <Cropper
              image={uploadedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleCropSubmit}
              className="px-6 py-2 bg-[#000] text-white rounded-xl hover:opacity-90"
            >
              Save
            </button>
            <button
              onClick={handleCropCancel}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </Container>
  );  
};

export default ProfileClient;