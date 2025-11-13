'use client';

import { type ChangeEvent, type RefObject } from 'react';
import { Switch } from '@headlessui/react';
import { motion } from 'framer-motion';
import NextImage from 'next/image';
import { twMerge } from 'tailwind-merge';
import { BiUpload } from 'react-icons/bi';

import Avatar from '../../components/Avatar';
import type { SafeUser } from '../../types';

interface ProfileHeroProps {
  currentUser: SafeUser;
  isHostView: boolean;
  canToggleRole: boolean;
  roleUpdating: boolean;
  onToggleRole: (nextIsHost: boolean) => void;
  coverImage: string | null;
  coverLoaded: boolean;
  onCoverLoaded: () => void;
  isOwner: boolean;
  pickCover: () => void;
  coverInputRef: RefObject<HTMLInputElement>;
  handleCoverSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  uploadingCover: boolean;
  busy: boolean;
  pickAvatar: () => void;
  avatarInputRef: RefObject<HTMLInputElement>;
  handleAvatarSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  avatarPreview: string | null;
}

const ProfileHero = ({
  currentUser,
  isHostView,
  canToggleRole,
  roleUpdating,
  onToggleRole,
  coverImage,
  coverLoaded,
  onCoverLoaded,
  isOwner,
  pickCover,
  coverInputRef,
  handleCoverSelect,
  uploadingCover,
  busy,
  pickAvatar,
  avatarInputRef,
  handleAvatarSelect,
  avatarPreview,
}: ProfileHeroProps) => {
  return (
    <div className="rounded-3xl overflow-visible shadow-xl border border-neutral-100 bg-white">
      <div className="relative z-0 h-56 sm:h-64 md:h-72 overflow-visible">
        <div className="absolute left-1/2 -bottom-3 translate-x-[-50%] z-[99999]">
          <Switch.Group as="div" className="flex flex-col items-center">
            <Switch
              checked={isHostView}
              onChange={(checked) => {
                if (roleUpdating) return;
                onToggleRole(checked);
              }}
              aria-label="Toggle role"
              className={twMerge(
                'relative inline-flex h-8 w-[64px] items-center rounded-full p-[3px]',
                'transition-colors duration-300 focus:outline-none overflow-visible bg-[#2200ffff]',
                isHostView ? 'bg-[#2200ffff] shadow-md' : 'bg-neutral-200 shadow-inner',
                (!canToggleRole || roleUpdating) && 'cursor-not-allowed opacity-70'
              )}
              disabled={!canToggleRole || roleUpdating}
              aria-busy={roleUpdating}
            >
              <motion.div
                key={isHostView ? 'pulse-host' : 'pulse-guest'}
                className={twMerge(
                  'pointer-events-none absolute inset-0 -m-[2px] rounded-full z-10',
                  isHostView ? 'ring-2 ring-[#000]' : 'ring-2 ring-neutral-400'
                )}
                initial={{ opacity: 0.55, scale: 1 }}
                animate={{ opacity: 0, scale: 1.18 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />

              <motion.span
                layout
                initial={false}
                transition={{ type: 'spring', stiffness: 340, damping: 23 }}
                className={twMerge(
                  'pointer-events-none absolute left-[3px] top-[3px] z-20',
                  'flex h-[26px] w-[34px] items-center justify-center rounded-full',
                  'px-[5px] text-[8px] font-semibold uppercase tracking-wide leading-none whitespace-nowrap',
                  isHostView ? 'bg-white text-neutral-900' : 'bg-[#000] text-white'
                )}
                animate={{ x: isHostView ? 24 : 0 }}
              >
                {roleUpdating ? '...' : isHostView ? 'Host' : 'Guest'}
              </motion.span>
            </Switch>
          </Switch.Group>
        </div>

        {coverImage ? (
          <NextImage
            src={coverImage}
            alt={`Cover for ${currentUser?.name ?? currentUser?.username ?? 'user'}`}
            fill
            placeholder="blur"
            blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
            className={twMerge(
              'rounded-3xl object-cover pointer-events-none z-0 transition-[filter,opacity,transform] duration-500 ease-out',
              coverLoaded ? 'blur-0 opacity-100 scale-100' : 'blur-md opacity-80 scale-[1.02]'
            )}
            onLoadingComplete={onCoverLoaded}
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-200" />
        )}

        <div className="rounded-3xl absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {isOwner && (
          <>
            <button
              type="button"
              onClick={pickCover}
              disabled={busy}
              className="aspect-square absolute top-3 right-3 z-[2] inline-flex items-center gap-2 rounded-full backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg transition"
              title="Change cover"
            >
              <BiUpload className="h-5 w-5" />
              {uploadingCover ? '…' : ''}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 z-[2] px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={pickAvatar}
                      disabled={busy}
                      className="group rounded-full outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-black/20"
                      title="Change avatar"
                    >
                      <div className="rounded-full overflow-hidden ring-0 transition shadow-md hover:shadow-lg cursor-pointer">
                        <Avatar
                          src={avatarPreview ?? currentUser?.image ?? undefined}
                          name={currentUser?.name ?? currentUser?.username ?? 'User'}
                          size={92}
                        />
                      </div>
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </>
                ) : (
                  <Avatar
                    src={currentUser?.image ?? undefined}
                    name={currentUser?.name ?? currentUser?.username ?? 'User'}
                    size={92}
                  />
                )}
              </div>

              <div className="text-white drop-shadow-lg">
                <p className="ml-1 text-2xl font-semibold flex items-center gap-2">
                  {currentUser?.username || currentUser?.name || 'User'}
                </p>

                {currentUser?.legalName && (
                  <p className="ml-1 text-sm text-white/80">{currentUser.legalName}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-white/90">
              {currentUser?.profession && (
                <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                  {currentUser.profession}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
