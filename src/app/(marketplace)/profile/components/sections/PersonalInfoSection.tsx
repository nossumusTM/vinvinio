'use client';

import { type ReactNode } from 'react';
import { FiMail, FiPhone, FiUser } from 'react-icons/fi';
import { TbMapPin } from 'react-icons/tb';

import type { SafeUser } from '../../../types';
import ProfileSectionCard from './ProfileSectionCard';

interface PersonalInfoSectionProps {
  currentUser: SafeUser;
}

const InfoRow = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon: ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
    <div className="mt-1 text-lg text-neutral-500">{icon}</div>
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-neutral-900">
        {value && value.trim() ? value : 'Not provided'}
      </p>
    </div>
  </div>
);

const PersonalInfoSection = ({ currentUser }: PersonalInfoSectionProps) => {
  return (
    <ProfileSectionCard
      title="Personal information"
      description="Keep your contact details up to date so guests and hosts can reach you."
      icon={<FiUser />}
    >
      <InfoRow label="Username" value={currentUser.username ?? currentUser.name ?? null} icon={<FiUser />} />
      <InfoRow label="Email" value={currentUser.email ?? null} icon={<FiMail />} />
      <InfoRow label="Phone" value={currentUser.phone ?? null} icon={<FiPhone />} />
      <InfoRow label="Primary location" value={currentUser.address ?? null} icon={<TbMapPin />} />
    </ProfileSectionCard>
  );
};

export default PersonalInfoSection;
