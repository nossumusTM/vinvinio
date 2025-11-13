'use client';

import { type ReactNode } from 'react';
import { FiAlertCircle, FiCheckCircle, FiMail, FiPhone } from 'react-icons/fi';
import { TbLock } from 'react-icons/tb';

import type { SafeUser } from '../../../types';
import ProfileSectionCard from './ProfileSectionCard';

interface LoginSecuritySectionProps {
  currentUser: SafeUser;
  verifying: boolean;
  onRequestEmailVerification: () => void;
  emailVerificationRequested: boolean;
  phoneVerificationRequested: boolean;
  phoneVerificationLoading: boolean;
  onRequestPhoneVerification: () => void;
  passwordUpdatedAt: Date | null;
}

const StatusBadge = ({
  active,
  label,
  icon,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
}) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
    }`}
  >
    {icon}
    {label}
  </span>
);

const LoginSecuritySection = ({
  currentUser,
  verifying,
  onRequestEmailVerification,
  emailVerificationRequested,
  phoneVerificationRequested,
  phoneVerificationLoading,
  onRequestPhoneVerification,
  passwordUpdatedAt,
}: LoginSecuritySectionProps) => {
  return (
    <ProfileSectionCard
      title="Login & security"
      description="Manage how you sign in and keep your account secure."
      icon={<TbLock />}
    >
      <div className="space-y-3">
        <p className="font-medium text-neutral-900">Email address</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <FiMail className="text-lg" />
          <span>{currentUser.email ?? 'Not set'}</span>
          <StatusBadge
            active={Boolean(currentUser.emailVerified)}
            label={currentUser.emailVerified ? 'Verified' : 'Pending verification'}
            icon={currentUser.emailVerified ? <FiCheckCircle /> : <FiAlertCircle />}
          />
          {!currentUser.emailVerified && (
            <button
              type="button"
              disabled={verifying || emailVerificationRequested}
              onClick={onRequestEmailVerification}
              className="text-xs font-semibold text-[#2200ffff] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {emailVerificationRequested ? 'Email sent' : 'Send verification email'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-neutral-900">Phone number</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          <FiPhone className="text-lg" />
          <span>{currentUser.phone ?? 'Not set'}</span>
          <StatusBadge
            active={Boolean(currentUser.phoneVerified)}
            label={currentUser.phoneVerified ? 'Verified' : 'Pending verification'}
            icon={currentUser.phoneVerified ? <FiCheckCircle /> : <FiAlertCircle />}
          />
          {!currentUser.phoneVerified && (
            <button
              type="button"
              disabled={phoneVerificationLoading || phoneVerificationRequested}
              onClick={onRequestPhoneVerification}
              className="text-xs font-semibold text-[#2200ffff] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phoneVerificationRequested ? 'Text sent' : 'Send verification text'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-neutral-900">Password</p>
        <div className="flex flex-col gap-1 text-sm text-neutral-600">
          <span>Last updated {passwordUpdatedAt ? passwordUpdatedAt.toLocaleDateString() : 'recently'}.</span>
          <button
            type="button"
            className="text-xs font-semibold text-[#2200ffff] hover:underline"
            onClick={() => {
              window.location.href = '/forgot-password';
            }}
          >
            Reset password
          </button>
        </div>
      </div>
    </ProfileSectionCard>
  );
};

export default LoginSecuritySection;
