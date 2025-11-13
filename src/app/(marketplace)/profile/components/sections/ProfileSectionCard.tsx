'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ProfileSectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

const transition = { duration: 0.25, ease: 'easeOut' };

const ProfileSectionCard = ({
  title,
  description,
  icon,
  children,
}: ProfileSectionCardProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={transition}
      className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-start gap-3">
        {icon ? <div className="mt-1 text-xl text-neutral-600">{icon}</div> : null}
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 text-sm text-neutral-700">{children}</div>
    </motion.section>
  );
};

export default ProfileSectionCard;
