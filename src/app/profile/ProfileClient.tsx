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
import { TbUserCircle, TbLock, TbCreditCard } from "react-icons/tb";
import { CgUserlane } from "react-icons/cg";
import { MdOutlineSecurity } from "react-icons/md";
import { RiSecurePaymentLine } from "react-icons/ri";
import ConfirmPopup from "../components/ConfirmPopup";
export const dynamic = 'force-dynamic';

interface ProfileClientProps {
  currentUser: SafeUser;
  referralBookings: {
    totalCount: number;
    totalAmount: number;
  };
}

const getRandomColor = () => {
  const colors = [
    'bg-[#000]'
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

  // console.log("Current user", currentUser);

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

  useEffect(() => {
    const fetchAnalytics = async () => {
      const res = await axios.get('/api/analytics/get');
      setAnalytics(res.data);
    };
    fetchAnalytics();
  }, [analytics]); 

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
        console.error('Failed to fetch payout method', err);
      }
    };
  
    fetchPayoutMethod();
  }, [payoutUpdated]);

  const handleSavePayoutMethod = async () => {
    try {
      const { method, number } = payoutInfo;
  
      if (!number) {
        setPopupMessage('Please enter your payout details.');
        return;
      }
  
      if (method === 'iban' && (!number.startsWith('IT') || number.replace(/\s/g, '').length !== 27)) {
        setPopupMessage('IBAN must start with IT and be 27 characters.');
        return;
      }
  
      await axios.post('/api/users/save-payout-method', {
        method,
        number, // ✅ Must match backend’s expected structure
      });
  
      setPopupMessage('Payout method saved!');
      setPayoutUpdated((prev) => !prev);
    } catch (err) {
      console.error('Failed to save payout method', err);
      setPopupMessage('Error saving payout method.');
    }
  };  
  
  const handleDeletePayoutMethod = async () => {
    try {
      await axios.delete('/api/users/delete-payout-method');
      setSavedPayout(null);
      setPopupMessage('Payout method deleted!');
    } catch (err) {
      console.error('Failed to delete payout method', err);
      setPopupMessage('Error deleting payout method.');
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

  return (
    <Container>
      <div className="pl-5">
      {/* <Heading title="Account" subtitle="" /> */}
      </div>

      {/* Avatar & name */}
      <div className="pl-5 pr-5 pb-6 border-b-[1px] border-neutral-300">
        <div className="flex items-center gap-4 mt-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profileImage ? (
              <Image
                src={profileImage}
                alt="User"
                width={60}
                height={60}
                className="rounded-full object-cover"
              />
            ) : (
              <div className={twMerge(
                "w-[60px] h-[60px] rounded-full flex items-center justify-center text-white font-bold text-xl",
                getRandomColor()
              )}>
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

          <div className="pt-1 text-normal">
            <p className="text-3xl font-semibold">{currentUser?.legalName || currentUser?.name || "Unnamed"}</p>
            <p className="text-1xl font-semibold">{currentUser?.email || ""}</p>
          </div>
        </div>
      </div>
  
          {activeSection === 'personal-info' && (
            <>
              <div className="mt-8 pt-10 pl-5 max-w-[600px] bg-white border rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveSection(null)}
                      className="text-sm text-black hover:underline"
                    >
                      ←
                    </button>
                    <h2 className="text-xl font-bold">Personal Area</h2>
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

                      {editingField === key ? (
                        key === 'address' ? (
                          <>
                            <div className="space-y-4 pt-4">
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
                              <div className="relative w-full">
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
                              <div className="relative w-full">
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
                              <div className="relative w-full">
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
                              <div className="relative w-full">
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
                              <div className="relative w-full">
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
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )
                      ) : (
                        <p className="text-lg font-medium break-words">
                          {key === 'address'
                            ? fieldValues.street || 'Not provided'
                            : typeof fieldValues[key as keyof typeof fieldValues] === 'string'
                              ? (fieldValues[key as keyof typeof fieldValues] as string)
                              : 'Not provided'}
                        </p>
                      )}
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
            </>
          )}

          {activeSection === 'login-security' && (
            <div className="mt-8 pt-10 pl-5 max-w-[600px] bg-white border rounded-xl shadow-sm p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="text-sm text-black hover:underline"
                  >
                    ←
                  </button>
                  <h2 className="text-xl font-bold">Login & Security</h2>
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

                {editingField === 'password' && (
                  <div className="space-y-4 pt-4">
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
                          setPopupMessage('Please check your input fields.');
                          return;
                        }

                        try {
                          await axios.put('/api/users/update-password', {
                            currentPassword,
                            newPassword,
                            confirmPassword: confirmNewPassword
                          });
                          setPopupMessage('Password updated successfully!');
                          setEditingField(null);
                        } catch (err) {
                          setPopupMessage('Failed to update password. Check current password.');
                        }
                      }}
                      className="text-sm text-white bg-[#000] hover:bg-neutral-700 px-4 py-1 rounded"
                    >
                      Update Password
                    </button>
                  </div>
                )}
              </div>

              {/* Account Deactivation */}
              <div className="space-y-2">
                <p className="text-sm text-neutral-500">Account</p>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-medium">Deactivate your account</p>
                  <button
                    onClick={() => setConfirmDeactivation(true)}
                    className="text-sm text-black underline hover:opacity-80"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="mt-8 pt-10 pl-5 max-w-[600px] bg-white border rounded-xl shadow-sm p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="text-sm text-black hover:underline"
                  >
                    ←
                  </button>
                  <h2 className="text-xl font-bold">Payments & Payouts</h2>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-6">
                <button
                  className={`px-4 py-2 rounded-lg ${activePaymentTab === 'payment' ? 'bg-black text-white' : 'border'}`}
                  onClick={() => setActivePaymentTab('payment')}
                >
                  Payment
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${activePaymentTab === 'payout' ? 'bg-black text-white' : 'border'}`}
                  onClick={() => setActivePaymentTab('payout')}
                >
                  Payout
                </button>
              </div>

              {activePaymentTab === 'payment' && (
                <>
                  <Heading title="Payment Methods" subtitle="Manage your cards and payment methods" />
                  {!savedCard ? (
                    <button
                      className="mt-4 px-4 border py-2 bg-black text-white transition hover:bg-white hover:text-black rounded-lg"
                      onClick={() => setShowCardModal(true)}
                    >
                      Add Card
                    </button>
                  ) : (
                    <div className="flex gap-4 mt-4">
                    {/* Edit Button */}
                    <button
                      className="px-4 py-2 border border-black text-black rounded-lg hover:bg-black hover:text-white transition"
                      onClick={() => setShowCardModal(true)}
                    >
                      Edit Card
                    </button>

                    {/* Delete Button */}
                    <button
                      className="px-4 py-2 border border-black text-black rounded-lg hover:bg-black hover:text-white transition"
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
                      className={`absolute w-full h-full duration-700 transform transition-transform preserve-3d ${isFlipped ? 'rotate-y-180' : ''
                        }`}
                    >
                      {/* FRONT SIDE */}
                      <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                        <p className="text-lg font-semibold tracking-widest">Payment Card</p>
                      </div>

                      {/* BACK SIDE */}
                      <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-between">
                        <div className="text-sm tracking-wider text-gray-400">Payment Method</div>

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
                    <Heading title="Coupon" subtitle="Have a discount code?" />
                    {showCouponInput ? (
                      <div className="mt-4">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter your coupon code"
                          className="w-full border p-2 rounded-lg"
                        />
                        <div className="flex gap-2 mt-2">
                          <button className="bg-black text-white px-4 py-1 rounded-lg hover:bg-neutral-800 transition">Apply</button>
                          <button className="border px-4 py-1 rounded-lg hover:bg-black hover:text-white transition" onClick={() => setShowCouponInput(false)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="mt-2 text-sm underline text-black"
                        onClick={() => setShowCouponInput(true)}
                      >
                        Add Coupon
                      </button>
                    )}
                  </div>
                </>
              )}

              {activePaymentTab === 'payout' && currentUser.role === 'promoter' && (
                <>
                  <Heading title="Payout Method" subtitle="Manage your payout credentials" />

                  {savedPayout ? (
                    <>
                      {/* Flip Card */}
                      <div
                        className="relative w-full max-w-sm h-56 perspective mt-6 cursor-pointer"
                        onClick={() => setIsFlipped(prev => !prev)}
                      >
                        <div
                          className={`absolute w-full h-full duration-700 transform transition-transform preserve-3d ${
                            isFlipped ? 'rotate-y-180' : ''
                          }`}
                        >
                          {/* FRONT */}
                          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                            <p className="text-xl font-semibold tracking-widest uppercase">
                              {savedPayout.method}
                            </p>
                          </div>

                          {/* BACK */}
                          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-center items-center gap-4">
                            <p className="text-xs tracking-wider text-gray-400">Payout Info</p>
                            <p className="text-lg font-mono text-center">
                            {savedPayout.method === 'paypal'
                              ? savedPayout.number
                              : savedPayout.number && savedPayout.number.length >= 8
                              ? `${savedPayout.number.slice(0, 4)}${'*'.repeat(savedPayout.number.length - 8)}${savedPayout.number.slice(-4)}`
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
                          Delete Payout Method
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Select Method */}
                      <div className="mt-4">
                        <label className="block mb-2 font-semibold">Payout Method</label>
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
                          className="peer w-full border border-neutral-300 rounded-md px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black pr-14"
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
                                : '/images/card.png'
                            }
                            alt="Method"
                            className="w-8 h-5 object-contain"
                          />
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex gap-4 mt-6">
                        <button
                          onClick={handleSavePayoutMethod}
                          className="bg-black text-white px-4 py-2 rounded"
                        >
                          Save Payout
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}

            </div>
          )}

          {showConfirmDeletePayout && (
            <ConfirmPopup
              title="Delete Payout Method"
              message="Are you sure you want to delete your payout method?"
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
                  setPopupMessage('Failed to deactivate account.');
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

      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Payment Card Details</h3>
              <button onClick={() => setShowCardModal(false)} className="text-sm">✕</button>
            </div>

            {cardInfo.method === 'card' && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <Image src="/images/Visa.png" alt="Visa" className="w-8" />
                  <Image src="/images/MasterCard.png" alt="MasterCard" className="w-6" />
                  <Image src="/images/americanexpress.png" alt="AMEX" className="w-6" />
                  <Image src="/images/Discover.png" alt="Discover" className="w-8" />
                </div>

                {/* Card Number with floating label */}
                <div className="relative w-full mb-4">
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
                          ? '/images/card.png'
                          : `/images/${cardType || 'card'}.png`
                      }
                      alt="Card Type"
                      className="w-8 h-5 object-contain"
                    />
                  </div>
                </div>

                {/* Expiration & CVV */}
                <div className="flex gap-4 mb-4">
                  <div className="relative w-1/2">
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
                      Expiration (MM/YY)
                    </label>
                  </div>

                  <div className="relative w-1/2">
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
                  <h3 className="text-md font-semibold">Billing Address</h3>

                  {[
                    { name: 'address', label: 'Street address' },
                    { name: 'apt', label: 'Apt or suite number' },
                    { name: 'city', label: 'City' },
                    { name: 'state', label: 'State' },
                    { name: 'zip', label: 'ZIP Code' }
                  ].map(({ name, label }) => (
                    <div key={name} className="relative w-full">
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

                  <CountrySelect
                    value={cardInfo.country}
                    onChange={(value) => setCardInfo({ ...cardInfo, country: value })}
                  />
                </div>

                <button
                  className="bg-black text-white px-4 py-3 rounded-xl w-full"
                  onClick={async () => {
                    try {
                      if (savedCard) {
                        await axios.delete('/api/users/delete-card');
                      }

                      const payload = { ...cardInfo };
                      await axios.post('/api/users/save-card', payload);
                      setCardUpdated(prev => !prev);
                      setShowCardModal(false);

                      const cardRes = await axios.get('/api/users/get-card');
                      const NEXT_PUBLIC_CARD_SECRET_KEY = process.env.NEXT_PUBLIC_CARD_SECRET_KEY || '';
                      const decrypt = (text: string) =>
                        CryptoJS.AES.decrypt(text, NEXT_PUBLIC_CARD_SECRET_KEY).toString(CryptoJS.enc.Utf8);

                      setSavedCard({
                        number: decrypt(cardRes.data.number),
                        expiration: decrypt(cardRes.data.expiration),
                        cvv: decrypt(cardRes.data.cvv),
                        name: decrypt(cardRes.data.name),
                      });

                      setPopupMessage('Card saved successfully!');
                    } catch (err) {
                      console.error(err);
                      setPopupMessage('Failed to save card. Please try again.');
                    }
                  }}
                >
                  Save Card
                </button>
              </>
            )}
          </div>
        </div>
      )}
  
      {/* ✅ SECTION: DEFAULT OVERVIEW */}
      {!activeSection && (
        <>
  
          {/* Account Blocks */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              onClick={() => setActiveSection('personal-info')}
              className="cursor-pointer p-6 border rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="text-4xl text-[#000] mb-4"><CgUserlane /></div>
              <p className="text-lg font-semibold">Personal Info</p>
              <p className="text-sm text-neutral-600">Edit your name, phone number, and more</p>
            </div>
  
            <div
              onClick={() => setActiveSection('login-security')}
              className="cursor-pointer p-6 border rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="text-4xl text-[#000] mb-4"><MdOutlineSecurity /></div>
              <p className="text-lg font-semibold">Login & Security</p>
              <p className="text-sm text-neutral-600">Manage your password and account access</p>
            </div>
  
            <div
              onClick={() => setActiveSection('payments')}
              className="cursor-pointer p-6 border rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="text-4xl text-[#000] mb-4"><RiSecurePaymentLine /></div>
              <p className="text-lg font-semibold">Payments & Payouts</p>
              <p className="text-sm text-neutral-600">View and update your payout methods</p>
            </div>
          </div>
  
          {/* Promoter Stats */}
          {currentUser.role === 'promoter' && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Referral Activities */}
              <div className="p-6 border rounded-xl shadow-sm hover:shadow-md">
                <p className="text-lg font-semibold mb-2">Referral Activities</p>
                <p className="text-sm text-neutral-600 mb-4">
                  Track your referral performance and earnings.
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
              <div className="p-6 border rounded-xl shadow-sm hover:shadow-md flex flex-col">
                <p className="text-lg font-semibold mb-2">Total Earned</p>
                <p className="text-sm text-neutral-600 mb-4">
                  Earning 10% from each referral booking made through your code.
                </p>
                <div className="rounded-xl p-10 pl-8 pr-8 flex justify-center md:items-center md:h-52 hover:shadow-sm">
                  <p className="text-3xl text-black font-semibold">
                    {formatCurrency((analytics.totalRevenue || 0) * 0.10)}
                  </p>
                </div>
              </div>

              {/* Payout Details */}
              <div className="p-6 border rounded-xl shadow-sm hover:shadow-md">
                <p className="text-lg font-semibold mb-2">Payout Method</p>
                <p className="text-sm text-neutral-600 mb-4">Deposits processed twice per month.</p>

                {savedPayout ? (
                  <div
                    className="relative w-full max-w-sm h-56 perspective"
                    onClick={() => setIsFlipped(prev => !prev)}
                  >
                    <div
                      className={`absolute w-full h-full duration-700 transform transition-transform preserve-3d ${
                        isFlipped ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* FRONT SIDE */}
                      <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                        <p className="text-lg font-semibold tracking-widest uppercase">
                          {savedPayout.method}
                        </p>
                      </div>

                      {/* BACK SIDE */}
                      <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-center items-center gap-4">
                        <p className="text-xs tracking-wider text-gray-400">Payout Info</p>
                        <p className="text-lg font-mono text-center">
                          {savedPayout.method === 'paypal'
                            ? savedPayout.number
                            : savedPayout.number && savedPayout.number.length >= 8
                            ? `${savedPayout.number.slice(0, 4)}${'*'.repeat(
                                savedPayout.number.length - 8
                              )}${savedPayout.number.slice(-4)}`
                            : '****'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-100 p-4 rounded-xl flex items-center justify-between">
                    <p className="text-sm text-neutral-600">Payout method is not provided</p>
                    <button
                      onClick={() => {
                        setActiveSection('payments');
                        setActivePaymentTab('payout');
                        const section = document.getElementById('payments-section');
                        if (section) section.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="text-sm underline text-black ml-4"
                    >
                      Go to Payouts
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
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
              className="px-6 py-2 bg-[#ff4d01] text-white rounded-xl hover:opacity-90"
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

      {currentUser.role === 'host' && (
        <div className="mt-6 space-y-2 space-x-4">
          <input
            type="text"
            placeholder="Enter promoter userId"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="border p-2 rounded w-500"
          />
          <button
            onClick={async () => {
              if (!targetUserId) return alert('Please provide a promoter userId');
              try {
                const res = await axios.post('/api/analytics/withdraw', { userId: targetUserId });
                alert(res.data.message);
              } catch (err) {
                alert('Failed to withdraw for this promoter.');
                console.error(err);
              }
            }}
            className="w-500 px-4 py-2 bg-[#000000] text-white rounded hover:bg-neutral-700 transition"
          >
            Withdraw for Promoter
          </button>
        </div>
      )}

    </Container>
  );  
};

export default ProfileClient;