'use client';

import { type ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Container from '@/app/(marketplace)/components/Container';
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import type { SafeUser } from '@/app/(marketplace)/types';

import ProfileHero from './components/ProfileHero';
import LoginSecuritySection from './components/sections/LoginSecuritySection';
import OverviewSection from './components/sections/OverviewSection';
import PaymentsSection from './components/sections/PaymentsSection';
import PersonalInfoSection from './components/sections/PersonalInfoSection';

interface ProfileClientProps {
  currentUser: SafeUser;
  referralBookings: {
    totalCount: number;
    totalAmount: number;
  };
}

type ProfileRole = SafeUser['role'];
type ToggleRole = Extract<ProfileRole, 'host' | 'customer'>;

const SWITCHABLE_TARGETS: ToggleRole[] = ['host', 'customer'];

const ProfileClient = ({ currentUser, referralBookings }: ProfileClientProps) => {
  const { formatConverted } = useCurrencyFormatter();
  const formatCurrency = useCallback(
    (value: number) => {
      const formatted = formatConverted(value);
      if (typeof formatted === 'string' && formatted.length > 0) {
        return formatted;
      }
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    },
    [formatConverted]
  );
  const suspensionDate = useMemo(() => {
    const raw = currentUser?.suspendedAt;
    if (!raw) return null;
    const parsed = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [currentUser?.suspendedAt]);

  const defaultRole = (currentUser.role ?? 'customer') as ProfileRole;
  const defaultAlternate = (currentUser.alternateRole as ProfileRole | null) ?? null;

  const [roleState, setRoleState] = useState<{ primary: ProfileRole; alternate: ProfileRole | null }>(() => ({
    primary: defaultRole,
    alternate: defaultAlternate,
  }));
  const [viewRole, setViewRole] = useState<ProfileRole>(() => defaultRole);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const lastRoleToastRef = useRef<ToggleRole | null>(null);

  const hostAccessible = roleState.primary === 'host' || roleState.alternate === 'host';
  const guestAccessible =
    roleState.primary === 'customer' ||
    roleState.primary === 'host' ||
    roleState.alternate === 'customer';
  const canToggleRole = hostAccessible && guestAccessible;
  const isHostView = viewRole === 'host';

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const busy = uploadingAvatar || uploadingCover;

  const coverImage = useMemo(() => {
    if (coverPreview) return coverPreview;
    if (typeof currentUser.coverImage === 'string') return currentUser.coverImage;
    return null;
  }, [coverPreview, currentUser.coverImage]);

  const pickAvatar = useCallback(() => {
    avatarInputRef.current?.click();
  }, []);

  const pickCover = useCallback(() => {
    coverInputRef.current?.click();
  }, []);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAvatarSelect = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const dataUrl = await fileToBase64(file);
      setAvatarPreview(dataUrl);
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      await axios.put('/api/users/profile-image', { image: base64 });
      toast.success('Profile photo updated.', {
        iconTheme: { primary: '#2200ffff', secondary: '#fff' },
      });
    } catch (error) {
      console.error('Avatar upload failed', error);
      toast.error('Unable to update profile photo.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  }, []);

  const handleCoverSelect = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setCoverLoaded(false);
    try {
      const dataUrl = await fileToBase64(file);
      setCoverPreview(dataUrl);
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      await axios.put('/api/users/cover', { image: base64 });
      toast.success('Cover image updated.', {
        iconTheme: { primary: '#2200ffff', secondary: '#fff' },
      });
    } catch (error) {
      console.error('Cover upload failed', error);
      toast.error('Unable to update cover image.');
    } finally {
      setUploadingCover(false);
      event.target.value = '';
    }
  }, []);

  const handleRoleToggle = useCallback(
    async (nextIsHost: boolean) => {
      const target: ToggleRole = nextIsHost ? 'host' : 'customer';
      if (!canToggleRole || roleUpdating) return;

      if (roleState.primary === target) {
        setViewRole(target);
        return;
      }

      setRoleUpdating(true);
      try {
        const response = await axios.patch('/api/users/role', { targetRole: target });
        const updatedRole = (response.data?.role as ProfileRole | undefined) ?? target;
        const updatedAlternate = (response.data?.alternateRole as ProfileRole | null | undefined) ?? roleState.primary ?? null;

        setRoleState({ primary: updatedRole, alternate: updatedAlternate });
        setViewRole(updatedRole);

        if (SWITCHABLE_TARGETS.includes(updatedRole as ToggleRole)) {
          const simplified = updatedRole as ToggleRole;
          if (lastRoleToastRef.current !== simplified) {
            lastRoleToastRef.current = simplified;
            toast.success(`Switched to ${simplified === 'host' ? 'Host' : 'Guest'} mode`, {
              iconTheme: { primary: '#2200ffff', secondary: '#fff' },
            });
            setTimeout(() => {
              if (lastRoleToastRef.current === simplified) {
                lastRoleToastRef.current = null;
              }
            }, 400);
          }
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

  const [verifying, setVerifying] = useState(false);
  const [emailVerificationRequested, setEmailVerificationRequested] = useState(false);
  const [phoneVerificationRequested, setPhoneVerificationRequested] = useState(false);
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);

  const handleEmailVerificationRequest = useCallback(async () => {
    if (verifying || emailVerificationRequested) return;

    setVerifying(true);
    try {
      await axios.post('/api/users/request-email-verification');
      setEmailVerificationRequested(true);
      toast.success('Verification email sent!', {
        iconTheme: { primary: '#2200ffff', secondary: '#fff' },
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      toast.error('Failed to send verification email.');
    } finally {
      setVerifying(false);
    }
  }, [emailVerificationRequested, verifying]);

  const handlePhoneVerificationRequest = useCallback(async () => {
    if (phoneVerificationLoading || phoneVerificationRequested) return;

    setPhoneVerificationLoading(true);
    try {
      await axios.post('/api/users/request-phone-verification');
      setPhoneVerificationRequested(true);
      toast.success("We'll text you shortly to verify your phone.", {
        iconTheme: { primary: '#2200ffff', secondary: '#fff' },
      });
    } catch (error) {
      console.error('Failed to request phone verification:', error);
      toast.error('Could not start phone verification right now.');
    } finally {
      setPhoneVerificationLoading(false);
    }
  }, [phoneVerificationLoading, phoneVerificationRequested]);

  const passwordUpdatedAt = useMemo(() => {
    if (!currentUser.passwordUpdatedAt) return null;
    const parsed = new Date(currentUser.passwordUpdatedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [currentUser.passwordUpdatedAt]);

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  } as const;

  const isOwner = Boolean(currentUser?.id);

  return (
    <Container className="py-10">
      <motion.div className="space-y-10 px-5" initial="hidden" animate="visible" variants={pageVariants}>
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

        <AnimatePresence mode="popLayout">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <PersonalInfoSection currentUser={currentUser} />
              <LoginSecuritySection
                currentUser={currentUser}
                verifying={verifying}
                onRequestEmailVerification={handleEmailVerificationRequest}
                emailVerificationRequested={emailVerificationRequested}
                phoneVerificationRequested={phoneVerificationRequested}
                phoneVerificationLoading={phoneVerificationLoading}
                onRequestPhoneVerification={handlePhoneVerificationRequest}
                passwordUpdatedAt={passwordUpdatedAt}
              />
            </div>
            <div className="space-y-6">
              <PaymentsSection
                referralBookings={referralBookings}
                formatCurrency={formatCurrency}
                isHostView={isHostView}
              />
              <OverviewSection
                currentUser={currentUser}
                viewRole={viewRole}
                suspensionDate={suspensionDate}
                formatCurrency={formatCurrency}
                referralBookingsTotal={referralBookings.totalAmount}
              />
            </div>
          </div>
        </AnimatePresence>
      </motion.div>
    </Container>
  );
};

export default ProfileClient;
