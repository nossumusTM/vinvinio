'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { SafeUser } from "@/app/(marketplace)/types";
import Container from "@/app/(marketplace)/components/Container";
import Heading from "@/app/(marketplace)/components/Heading";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import CryptoJS from 'crypto-js';
import axios from "axios";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/app/(marketplace)/utils/cropImage';
import CountrySelect from "../components/inputs/CountrySelect";
import { CountrySelectValue } from "@/app/(marketplace)/components/inputs/CountrySelect";
import AnimatedModal from "../components/modals/AnimatedModal";
import { AnimatePresence, motion, type Variants, type Easing } from 'framer-motion';
import { TbUserCircle, TbLock, TbCreditCard } from "react-icons/tb";
import { CgUserlane } from "react-icons/cg";
import { MdOutlineSecurity } from "react-icons/md";
import { RiSecurePaymentLine } from "react-icons/ri";
import ConfirmPopup from "../components/ConfirmPopup";
import EarningsCard from "../components/EarnigsCard";
import { FiInfo, FiMail, FiPhone } from "react-icons/fi";
import FAQ from "../components/FAQ";
import toast from "react-hot-toast";
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import { slugSegment } from '@/app/(marketplace)/libs/links';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import ProfileHero from "./components/ProfileHero";

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
  books?: number;
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
  const { formatConverted } = useCurrencyFormatter();
  const suspensionDate = useMemo(() => {
    const raw = currentUser?.suspendedAt;
    if (!raw) return null;
    const parsed = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [currentUser?.suspendedAt]);
  const { totalCount, totalAmount } = referralBookings;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState(currentUser.image || '');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showConfirmDeletePayout, setShowConfirmDeletePayout] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
  const [emailVerificationRequested, setEmailVerificationRequested] = useState(false);
  const [phoneVerificationRequested, setPhoneVerificationRequested] = useState(false);

  type ProfileRole = 'customer' | 'host' | 'promoter' | 'moder';
  const defaultRole = currentUser.role as ProfileRole;
  const defaultAlternate = (currentUser.alternateRole as ProfileRole | null) ?? null;
  const [roleState, setRoleState] = useState<{
    primary: ProfileRole;
    alternate: ProfileRole | null;
  }>(() => ({
    primary: defaultRole,
    alternate: defaultAlternate,
  }));
  const [viewRole, setViewRole] = useState<ProfileRole>(() => defaultRole);
  const [roleUpdating, setRoleUpdating] = useState(false);

  // --- OWNER & MEDIA STATE ---
const [isOwner, setIsOwner] = useState(false);

const avatarInputRef = useRef<HTMLInputElement | null>(null);
const coverInputRef  = useRef<HTMLInputElement | null>(null);

const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
const [coverPreview,  setCoverPreview]  = useState<string | null>(null);
const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
const [coverLoaded,   setCoverLoaded]   = useState(false);

const [uploadingAvatar, setUploadingAvatar] = useState(false);
const [uploadingCover,  setUploadingCover]  = useState(false);

const busy = uploadingAvatar || uploadingCover;

// --- OWNER RESOLUTION (profile == currentUser) ---
useEffect(() => {
  setIsOwner(Boolean(currentUser?.id));
}, [currentUser?.id]);

// --- FETCH COVER FROM API (optional, if you store cover separately) ---
useEffect(() => {
  let alive = true;
  (async () => {
    try {
      if (!currentUser?.id) return;
      const res = await fetch(`/api/users/cover?userId=${encodeURIComponent(currentUser.id)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (alive) setCoverImageUrl(data?.coverImage ?? null);
    } catch {}
  })();
  return () => { alive = false; };
}, [currentUser?.id]);

// --- FILE HELPERS ---
const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const pickAvatar = () => avatarInputRef.current?.click();
const pickCover  = () => coverInputRef.current?.click();

// --- UPLOAD HANDLERS (no crop; plug in your cropper if needed) ---
const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadingAvatar(true);
  try {
    const dataUrl = await fileToBase64(file);
    setAvatarPreview(dataUrl);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    await axios.put('/api/users/profile-image', { image: base64 });
  } catch (err) {
    console.error('Avatar upload failed', err);
  } finally {
    setUploadingAvatar(false);
    e.target.value = '';
  }
};

const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadingCover(true);
  try {
    const dataUrl = await fileToBase64(file);
    setCoverLoaded(false);
    setCoverPreview(dataUrl);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    await axios.put('/api/users/cover', { image: base64 });
  } catch (err) {
    console.error('Cover upload failed', err);
  } finally {
    setUploadingCover(false);
    e.target.value = '';
  }
};

// --- CHOOSE COVER IMAGE SOURCE ---
const coverImage = useMemo(() => {
  if (coverPreview)    return coverPreview;           // fresh local
  if (coverImageUrl)   return coverImageUrl;          // fetched from API
  if (currentUser?.coverImage) return currentUser.coverImage as string; // if stored on user
  return null;
}, [coverPreview, coverImageUrl, currentUser?.coverImage]);

  const EASE_BEZIER: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

  const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_BEZIER },
    },
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_BEZIER },
    },
    exit: {
      opacity: 0,
      y: -14,
      transition: { duration: 0.25, ease: EASE_BEZIER },
    },
  };

  const hostAccessible = roleState.primary === 'host' || roleState.alternate === 'host';
  const guestAccessible =
    roleState.primary === 'customer' ||
    roleState.primary === 'host' ||
    roleState.alternate === 'customer';
  const canToggleRole = hostAccessible && guestAccessible;
  const isHostView = viewRole === 'host';
  const modeLabel = isHostView ? 'Host Mode' : 'Guest Mode';
  const modeGradient = isHostView
    ? 'from-indigo-500 via-sky-500 to-blue-500'
    : 'from-amber-400 via-orange-500 to-rose-500';
  const modeDescription = isHostView
    ? 'Manage listings, payouts and analytics without losing guest-facing data.'
    : 'Preview as a guest while we keep your host workspace untouched.';

  const lastPasswordUpdateDate = useMemo(
    () => (currentUser.passwordUpdatedAt ? new Date(currentUser.passwordUpdatedAt) : null),
    [currentUser.passwordUpdatedAt]
  );

  const lastRoleToastRef = useRef<'host' | 'customer' | null>(null);

  const handleRoleToggle = useCallback(
    async (nextIsHost: boolean) => {
      if (!canToggleRole || roleUpdating) return;

      const target: 'host' | 'customer' = nextIsHost ? 'host' : 'customer';

      if (roleState.primary === target) {
        setViewRole(target);
        return;
      }

      setRoleUpdating(true);
      try {
        const response = await axios.patch('/api/users/role', { targetRole: target });
        const updatedRole = (response.data?.role ?? target) as ProfileRole;
        const updatedAlternate = (response.data?.alternateRole ?? roleState.primary ?? null) as
          | ProfileRole
          | null;

        setRoleState({ primary: updatedRole, alternate: updatedAlternate });
        setViewRole(updatedRole);

        if (lastRoleToastRef.current !== updatedRole) {
          lastRoleToastRef.current = updatedRole;
          toast.success(`Switched to ${updatedRole === 'host' ? 'Host' : 'Guest'} mode`, {
            iconTheme: { primary: '#2200ffff', secondary: '#fff' },
          });

          setTimeout(() => {
            if (lastRoleToastRef.current === updatedRole) {
              lastRoleToastRef.current = null;
            }
          }, 400);
        }
      } catch (error) {
        console.error('Failed to switch mode', error);
        toast.error('Unable to switch mode. Please try again.');
      } finally {
        setRoleUpdating(false);
      }
    },
    [canToggleRole, roleUpdating, roleState.primary]
  );

  const handleEmailVerificationRequest = async () => {
    if (verifying || emailVerificationRequested) return;

    setVerifying(true);
    try {
      await axios.post('/api/users/request-email-verification');
      setEmailVerificationRequested(true);
      toast.success('Verification email sent!', {
        iconTheme: {
          primary: '#2200ffff',
          secondary: '#fff',
        },
      });
    } catch (err) {
      console.error('Failed to send verification email:', err);
      toast.error('Failed to send verification email.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePhoneVerificationRequest = async () => {
    if (phoneVerificationLoading || phoneVerificationRequested) return;

    setPhoneVerificationLoading(true);
    try {
      const response = await axios.post('/api/users/request-phone-verification');
      if (response.status === 200) {
        setPhoneVerificationRequested(true);
        toast.success('We\'ll text you shortly to verify your phone.', {
          iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('Failed to request phone verification:', error);
      toast.error('Could not start phone verification right now.');
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

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
    username: string;
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
    username: currentUser?.username || '',
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
      question: 'Do you collect CVV and expiration date?',
      answer:
        'No, for security reasons, we only collect and store your card number. CVV and expiration date are not collected or stored. This ensures your sensitive payment details stay safe while still allowing for faster checkout.',
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
  
    if (['host', 'promoter'].includes(viewRole)) {
      fetchEarnings();
    }
  }, [viewRole]);

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
    if (viewRole !== 'promoter') return;

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
  const PersonalInfoSection = () => (
    <AnimatePresence mode="wait">
      {activeSection === 'personal-info' && (
        <motion.section
          key="personal-info"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-8 flex w-full flex-col gap-10 pt-0 md:pt-5 lg:flex-row"
        >
          <motion.div
            variants={cardVariants}
            className="w-full rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg lg:w-1/2"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSection(null)}
                  className="rounded-full px-2 py-1 text-xs text-black transition hover:bg-neutral-100 md:text-sm"
                >
                  ←
                </button>
                <h2 className="text-base font-bold md:text-lg">Personal Area</h2>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { label: 'Username', key: 'username' },
                { label: 'Legal name', key: 'legalName' },
                { label: 'Email address', key: 'email' },
                { label: 'Phone number', key: 'phone' },
                { label: 'Preferred contact method', key: 'contact' },
                { label: 'Address', key: 'address' },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-neutral-500 md:text-sm">{label}</p>

                    <AnimatePresence mode="wait">
                      {editingField === key ? (
                        key === 'address' ? (
                          <>
                            <motion.div
                              key="address-edit"
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.25 }}
                              className="space-y-4 pt-4"
                            >
                              <CountrySelect
                                value={fieldValues.country ?? undefined}
                                onChange={(val) =>
                                  setFieldValues((prev) => ({
                                    ...prev,
                                    country: val,
                                  }))
                                }
                              />

                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="street"
                                  placeholder=" "
                                  value={fieldValues.street}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, street: e.target.value }))
                                  }
                                  className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="street"
                                  className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                    fieldValues.street ? 'top-2 text-sm text-black' : ''
                                  }`}
                                >
                                  Street address
                                </label>
                              </div>

                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="apt"
                                  placeholder=" "
                                  value={fieldValues.apt}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, apt: e.target.value }))
                                  }
                                  className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="apt"
                                  className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                    fieldValues.apt ? 'top-2 text-sm text-black' : ''
                                  }`}
                                >
                                  Apt, suite, etc. (optional)
                                </label>
                              </div>

                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="city"
                                  placeholder=" "
                                  value={fieldValues.city}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, city: e.target.value }))
                                  }
                                  className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="city"
                                  className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                    fieldValues.city ? 'top-2 text-sm text-black' : ''
                                  }`}
                                >
                                  City
                                </label>
                              </div>

                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="state"
                                  placeholder=" "
                                  value={fieldValues.state}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, state: e.target.value }))
                                  }
                                  className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="state"
                                  className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                    fieldValues.state ? 'top-2 text-sm text-black' : ''
                                  }`}
                                >
                                  State / Province
                                </label>
                              </div>

                              <div className="relative w-full px-1">
                                <input
                                  type="text"
                                  id="zip"
                                  placeholder=" "
                                  value={fieldValues.zip}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({ ...prev, zip: e.target.value }))
                                  }
                                  className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <label
                                  htmlFor="zip"
                                  className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                    fieldValues.zip ? 'top-2 text-sm text-black' : ''
                                  }`}
                                >
                                  ZIP Code
                                </label>
                              </div>
                            </motion.div>

                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleSaveField(key)}
                              className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                            >
                              Save
                            </motion.button>
                          </>
                        ) : (
                          <motion.div
                            key={`${key}-edit`}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-4 pt-4"
                          >
                            <input
                              type="text"
                              value={fieldValues[key as keyof typeof fieldValues] as string}
                              onChange={(e) =>
                                setFieldValues((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                            />
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleSaveField(key)}
                              className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                            >
                              Save
                            </motion.button>

                          </motion.div>
                        )
                      ) : key === 'address' ? (
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
                              <span>
                                {fieldValues.country.city ? `${fieldValues.country.city}, ` : ''}
                                {fieldValues.country.label}
                              </span>
                            </div>
                          )}

                          {fieldValues.street && <div>{fieldValues.street}</div>}
                          {fieldValues.apt && <div>{fieldValues.apt}</div>}
                          {fieldValues.state && <div>{fieldValues.state}</div>}
                          {fieldValues.zip && <div>{fieldValues.zip}</div>}

                          {!fieldValues.country &&
                            !fieldValues.street &&
                            !fieldValues.apt &&
                            !fieldValues.state &&
                            !fieldValues.zip && (
                              <p className="text-md text-neutral-800">Not provided</p>
                            )}
                        </div>
                      ) : key === 'email' ? (
                        <div className="space-y-2 pt-1">
                          <p className="text-sm text-neutral-800 md:text-base">
                            {fieldValues.email?.trim() || 'Not provided'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                currentUser?.emailVerified
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {currentUser?.emailVerified ? 'Verified' : 'Unverified'}
                            </span>
                            {!currentUser?.emailVerified && fieldValues.email?.trim() && (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={handleEmailVerificationRequest}
                                disabled={verifying || emailVerificationRequested}
                                className={`rounded-full border border-neutral-900/20 px-3 py-1 text-[12px] font-medium text-neutral-800 transition hover:bg-neutral-900/5 ${
                                  verifying ? 'pointer-events-none opacity-60' : ''
                                }`}
                              >
                                {verifying
                                  ? 'Sending…'
                                  : emailVerificationRequested
                                  ? 'Check your inbox'
                                  : 'Verify email'}
                              </motion.button>
                            )}
                          </div>
                        </div>
                      ) : key === 'phone' ? (
                        <div className="space-y-2 pt-1">
                          <p className="text-sm text-neutral-800 md:text-base">
                            {fieldValues.phone?.trim() || 'Not provided'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                currentUser?.phoneVerified
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {currentUser?.phoneVerified ? 'Verified' : 'Unverified'}
                            </span>
                            {!currentUser?.phoneVerified && fieldValues.phone?.trim() && (
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.97 }}
                                onClick={handlePhoneVerificationRequest}
                                disabled={phoneVerificationLoading || phoneVerificationRequested}
                                className={`rounded-full border border-neutral-900/20 px-3 py-1 text-[12px] font-medium text-neutral-800 transition hover:bg-neutral-900/5 ${
                                  phoneVerificationLoading ? 'pointer-events-none opacity-60' : ''
                                }`}
                              >
                                {phoneVerificationLoading
                                  ? 'Sending…'
                                  : phoneVerificationRequested
                                  ? 'Request sent'
                                  : 'Verify phone'}
                              </motion.button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-800 md:text-base">
                          {typeof fieldValues[key as keyof typeof fieldValues] === 'string' &&
                          (fieldValues[key as keyof typeof fieldValues] as string).trim()
                            ? (fieldValues[key as keyof typeof fieldValues] as string)
                            : 'Not provided'}
                        </p>

                      )}
                    </AnimatePresence>
  );

  const LoginSecuritySection = () => (
    <AnimatePresence mode="wait">
      {activeSection === 'login-security' && (
        <motion.section
          key="login-security"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="mt-8 flex w-full flex-col gap-10 pt-0 md:pt-5 lg:flex-row"
        >
          <motion.div
            variants={cardVariants}
            className="w-full rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg lg:w-1/2"
          >
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setActiveSection(null)}
                className="rounded-full px-2 py-1 text-xs text-black transition hover:bg-neutral-100 md:text-sm"
              >
                ←
              </button>
              <h2 className="text-base font-bold md:text-lg">Login &amp; Security</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-700 md:text-base">Password</p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setEditingField(editingField === 'password' ? null : 'password')}
                    className="text-xs text-black underline-offset-2 transition hover:underline md:text-sm"
                  >
                    {editingField === 'password' ? 'Cancel' : 'Update'}
                  </motion.button>
                </div>
                <p className="text-xs text-neutral-400 md:text-sm">
                  Last updated: {lastPasswordUpdateDate ? lastPasswordUpdateDate.toLocaleDateString() : 'Not available'}
                </p>

                <AnimatePresence mode="wait">
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
                        className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                        id="currentPassword"
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                        id="newPassword"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                        id="confirmNewPassword"
                      />
                      <motion.button
                        whileTap={{ scale: 0.97 }}
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
                              confirmPassword: confirmNewPassword,
                            });
                            setEditingField(null);
                            toast.success('Password updated successfully!', {
                              iconTheme: {
                                primary: '#2200ffff',
                                secondary: '#fff',
                              },
                            });
                          } catch (error) {
                            console.error('Error updating password:', error);
                            toast.error('Unable to update password.');
                          }
                        }}
                        className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                      >
                        Save password
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
  );

  const PaymentsSection = () => (
    <AnimatePresence mode="wait">
      {activeSection === 'payments' && (
        <motion.section
          key="payments"
          id="payments-section"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full"
        >
          <div className="mt-8 pt-0 md:pt-5 flex flex-col lg:flex-row gap-10 w-full items-start">
            <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-md hover:shadow-lg p-6">

            {/* Header */}
              <div className="flex justify-between items-center mb-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSection(null)}
                  className="text-sm text-black bg-transparent hover:bg-neutral-100 rounded-full py-1 px-2 transition"
                >
                  ←
                </button>
                <h2 className="text-md md:text-lg font-bold">Payments & Withdrawal</h2>
              </div>
            </div>
              {/* Tabs */}
              {viewRole === 'promoter' && (
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
              {viewRole === 'customer' && (
              <div className="flex gap-4 mb-6">
                {/* <button
                  className={`px-4 py-2 rounded-lg ${activePaymentTab === 'payment' ? 'bg-black text-white' : 'border'}`}
                  onClick={() => setActivePaymentTab('payment')}
                >
                  Payment
                </button> */}
              </div>
              )}

              {activePaymentTab === 'payment' && viewRole === 'customer' && (
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
                     <div className="relative w-full px-1">
                      <input
                        id="coupon"
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder=" "
                        className="peer w-full shadow-md border border-neutral-300 rounded-lg px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <label
                        htmlFor="coupon"
                        className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                          duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                          peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                      >
                        Enter your coupon code
                      </label>
                    </div>
                      <div className="flex gap-2 mt-5">
                        <button
                          className="bg-black text-white px-4 py-1 rounded-lg hover:bg-neutral-800 transition"
                          onClick={async () => {
                            if (!couponCode) return toast.error('Enter a coupon code');
                            try {
                              const res = await axios.post('/api/coupon/addcoupon', { code: couponCode });
                              toast.success(`Coupon "${couponCode}" applied!`, {
                                iconTheme: {
                                  primary: '#2200ffff',
                                  secondary: '#fff',
                                }
                              });
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
  );

  const OverviewSection = () => (
    <AnimatePresence mode="wait">
      {!activeSection && (
        <motion.div
          key="overview"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="space-y-10"
        >
          <motion.div
            variants={cardVariants}
            className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-0"
          >
            {[
              {
                sectionKey: 'personal-info',
                icon: <CgUserlane />,
                title: 'Personal Info',
                description: 'Edit your name, phone number, and more',
              },
              {
                sectionKey: 'login-security',
                icon: <MdOutlineSecurity />,
                title: 'Login & Security',
                description: 'Manage your password and account access',
              },
              {
                sectionKey: 'payments',
                icon: <RiSecurePaymentLine />,
                title: 'Payments & Withdrawal',
                description: 'View and update your withdrawal methods',
              },
            ].map(({ sectionKey, icon, title, description }) => (
              <motion.button
                key={sectionKey}
                type="button"
                onClick={() => setActiveSection(sectionKey)}
                variants={cardVariants}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.008 }}
                className="flex h-full flex-col rounded-2xl bg-white p-6 text-left shadow-md transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black/50"
              >
                <div className="text-4xl text-black">{icon}</div>
                <p className="mt-4 text-lg font-semibold text-neutral-900">{title}</p>
                <p className="text-sm text-neutral-600 md:text-base">{description}</p>
              </motion.button>
            ))}
          </motion.div>

          {viewRole === 'promoter' && (
            <motion.div
              variants={cardVariants}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                <p className="text-lg font-semibold text-neutral-900">Referral Activities</p>
                <p className="mt-2 text-sm text-neutral-600 md:text-base">
                  Performance and earnings overview — renewed twice a month.
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                    <span className="font-medium">Total Books</span>
                    <span className="text-lg font-semibold text-black">{analytics.totalBooks}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                    <span className="font-medium">QR Code Scanned</span>
                    <span className="text-lg font-semibold text-black">{analytics.qrScans}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                    <span className="font-medium">Total Books Revenue</span>
                    <span className="text-lg font-semibold text-black">
                      {formatConverted(analytics.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                <div>
                  <p className="text-lg font-semibold text-neutral-900">Pre-Withdrawal Revenue</p>
                  <p className="mt-2 text-sm text-neutral-600 md:text-base">
                    Earning 10% from each referral booking made through your code.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-center rounded-xl bg-neutral-50 p-10 md:h-52">
                  <p className="text-3xl font-semibold text-black">
                    {formatConverted((analytics.totalRevenue || 0) * 0.1)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                <p className="text-lg font-semibold text-neutral-900">Withdrawal Method</p>
                <p className="mt-2 text-sm text-neutral-600 md:text-base">
                  Deposits processed twice per month.
                </p>

                {savedPayout ? (
                  <div
                    className="relative mt-6 h-56 w-full max-w-sm cursor-pointer perspective"
                    onClick={() => setIsFlipped((prev) => !prev)}
                  >
                    <div
                      className={`absolute h-full w-full transform rounded-2xl transition-transform duration-700 preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      <div className="absolute flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white backface-hidden">
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
                              : '/images/card.png'
                          }
                          alt={savedPayout.method}
                          className="h-auto w-24 object-contain"
                          width={64}
                          height={32}
                        />
                      </div>

                      <div className="absolute flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white backface-hidden rotate-y-180">
                        <p className="text-xs tracking-wider text-gray-400">Credentials</p>
                        <p className="text-center text-lg font-mono">
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
                  <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
                    <p>Withdrawal method is not provided</p>
                    <button
                      onClick={() => {
                        setActiveSection('payments');
                        setActivePaymentTab('payout');
                        const section = document.getElementById('payments-section');
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-sm font-medium text-black underline"
                    >
                      Go to Withdraw
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {viewRole === 'host' && (
            <motion.div
              variants={cardVariants}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                <p className="text-lg font-semibold text-neutral-900">Booking Activity</p>
                <p className="mt-2 text-sm text-neutral-600 md:text-base">
                  Earnings and bookings overview — renewed twice a month.
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                    <span className="font-medium">Total Bookings</span>
                    <span className="text-lg font-semibold text-black">{hostAnalytics.totalBooks}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                    <span className="font-medium">Total Revenue</span>
                    <span className="text-lg font-semibold text-black">
                      {formatConverted(hostAnalytics.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                <div>
                  <p className="text-lg font-semibold text-neutral-900">Pre-Withdrawal Revenue</p>
                  <p className="mt-2 text-sm text-neutral-600 md:text-base">
                    As a host, you earn 90% of your listing revenue.
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-center rounded-xl bg-neutral-50 p-10 md:h-52">
                  <p className="text-3xl font-semibold text-black">
                    {formatConverted((hostAnalytics.totalRevenue || 0) * 0.9)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                <p className="text-lg font-semibold text-neutral-900">Withdrawal Method</p>
                <p className="mt-2 text-sm text-neutral-600 md:text-base">
                  Deposits processed twice per month.
                </p>

                {savedPayout ? (
                  <div
                    className="relative mt-6 h-56 w-full max-w-sm cursor-pointer perspective"
                    onClick={() => setIsFlipped((prev) => !prev)}
                  >
                    <div
                      className={`absolute h-full w-full transform rounded-2xl transition-transform duration-700 preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      <div className="absolute flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white backface-hidden">
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
                              : '/images/card.png'
                          }
                          alt={savedPayout.method}
                          className="h-auto w-24 object-contain"
                          width={64}
                          height={32}
                        />
                      </div>

                      <div className="absolute flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white backface-hidden rotate-y-180">
                        <p className="text-xs tracking-wider text-gray-400">Credentials</p>
                        <p className="text-center text-lg font-mono">
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
                  <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
                    <p>Withdrawal method is not provided</p>
                    <button
                      onClick={() => {
                        setActiveSection('payments');
                        setActivePaymentTab('payout');
                        const section = document.getElementById('payments-section');
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-sm font-medium text-black underline"
                    >
                      Go to Withdraw
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {(viewRole === 'host' || viewRole === 'promoter') && (
            <motion.div variants={cardVariants} className="mt-2">
              <EarningsCard
                title="What You’ve Achieved"
                roleLabel={viewRole === 'host' ? 'Host' : 'Promoter'}
                dailyData={earnings.daily}
                monthlyData={earnings.monthly}
                yearlyData={earnings.yearly}
                totalEarnings={earnings.totalEarnings}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

    return () => clearInterval(interval);
  }, [viewRole]);

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
  }, [currentUser?.role]);

  useEffect(() => {
    try {
      const parsedAddress = currentUser.address ? JSON.parse(currentUser.address) : {};
      const normalizedCountry =
        parsedAddress && typeof parsedAddress === 'object' && 'country' in parsedAddress
          ? (parsedAddress.country as CountrySelectValue | null)
          : null;

      setFieldValues({
        username: currentUser.username || '',
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        contact: currentUser.contact || '',
        legalName: currentUser.legalName || '',
        country: normalizedCountry,
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
  
    if (['promoter', 'host'].includes(viewRole)) {
      fetchPayoutMethod();
    }
    // fetchPayoutMethod();
  }, [payoutUpdated, viewRole]);

  useEffect(() => {
    if (['promoter', 'host'].includes(viewRole)) {
      setActivePaymentTab('payout');
    } else if (viewRole === 'customer') {
      setActivePaymentTab('payment');
    }
  }, [viewRole]);

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
            primary: '#2200ffff',
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
            primary: '#2200ffff',
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
      } else if (key === 'username') {
        const sanitized = slugSegment(fieldValues.username || '').toLowerCase();
        payload = { username: sanitized };
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

  // useEffect(() => {
  //   const checkAndSubscribe = async () => {
  //     try {
  //       const res = await fetch(`/api/email/check-subscription?email=${currentUser.email}`);
  //       const data = await res.json();
  
  //       if (data?.subscribed) {
  //         setIsSubscribed(true);
  //       } else {
  //         // Auto-subscribe user if not yet subscribed
  //         const subRes = await fetch('/api/email/profile-newsletter', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({ email: currentUser.email, type: 'experience' }),
  //         });
  
  //         if (subRes.ok) {
  //           setIsSubscribed(true);
  //           console.log('✅ Auto-subscribed to Newsletter');
  //         } else {
  //           console.warn('⚠️ Auto-subscription failed');
  //         }
  //       }
  //     } catch (err) {
  //       console.error('❌ Failed to check or subscribe to newsletter', err);
  //     }
  //   };
  
  //   if (currentUser?.role === 'customer') {
  //     checkAndSubscribe();
  //   }
  // }, [currentUser]);  

  // const handleToggleSubscription = async () => {
  //   setLoading(true);
  //   try {
  //     const endpoint = isSubscribed
  //       ? '/api/email/profile-newsletter'
  //       : '/api/email/profile-newsletter';
  
  //     const method = isSubscribed ? 'DELETE' : 'POST';
  
  //     const res = await fetch(endpoint, {
  //       method,
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email: currentUser.email, type: 'experience' }),
  //     });
  
  //     if (!res.ok) throw new Error('Failed to toggle subscription');
  
  //     setIsSubscribed(!isSubscribed);
  //   } catch (error) {
  //     console.error('Toggle subscription error:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch(`/api/email/check-subscription?email=${currentUser.email}&type=experience`);
        const data = await res.json();
        setIsSubscribed(data.subscribed);
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
      } finally {
        setLoadingSubscription(false);
      }
    };

    if (currentUser?.email) checkSubscription();
  }, [currentUser?.email]);


  const handleToggleSubscription = async () => {
    setLoading(true);
    try {
      const method = isSubscribed ? 'DELETE' : 'POST';
      const res = await fetch('/api/email/profile-newsletter', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, type: 'experience' }),
      });

      if (res.status === 409) {
        console.info('Already subscribed');
        toast('Already subscribed 💌');
        setIsSubscribed(true); // <-- ensure UI reflects DB truth
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to toggle subscription');
      }

      setIsSubscribed(!isSubscribed);
      toast.success(
        isSubscribed ? 'Unsubscribed from newsletter.' : 'Subscribed to newsletter.', 
        {
          iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
          },
        }
      );
    } catch (error) {
      console.error('Toggle subscription error:', error);
      toast.error('Something went wrong while toggling subscription.');
    } finally {
      setLoading(false);
    }
  };

    return (
    <Container className="py-10">
      <motion.div
        className="pageadjust px-5 space-y-8"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >

      <ProfileHero
        currentUser={currentUser}
        isHostView={isHostView}
        canToggleRole={canToggleRole}
        roleUpdating={roleUpdating}
        onToggleRole={handleRoleToggle}
        coverImage={coverImage}
        coverLoaded={coverLoaded}
        onCoverLoaded={() => setCoverLoaded(true)}
        isOwner={isOwner}
        pickCover={pickCover}
        coverInputRef={coverInputRef}
        handleCoverSelect={handleCoverSelect}
        uploadingCover={uploadingCover}
        busy={busy}
        pickAvatar={pickAvatar}
        avatarInputRef={avatarInputRef}
        handleAvatarSelect={handleAvatarSelect}
        avatarPreview={avatarPreview}
      />

      <PersonalInfoSection />

      <LoginSecuritySection />

      <PaymentsSection />

      <OverviewSection />

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
      </motion.div>

    </Container>
  );  
};

export default ProfileClient;