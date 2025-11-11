'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AiOutlineBell,
  AiOutlineCalendar,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineStop,
  AiOutlineUpload,
} from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { BsStarFill } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';

import Avatar from '../Avatar';

type Actor = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export type NotificationType =
  | 'booking_received'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'listing_approved'
  | 'listing_rejected'
  | 'listing_deactivated'
  | 'listing_submitted'
  | 'listing_revision_requested'
  | 'message_received'
  | 'review_received';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  actor: Actor | null;
  context?: Record<string, unknown>;
};

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type NotificationMeta = {
  label: string;
  accent: string;
  accentBg: string;
  icon: (className: string) => JSX.Element;
};

const notificationMeta: Record<NotificationType, NotificationMeta> = {
  booking_received: {
    label: 'Booking received',
    accent: 'text-sky-600',
    accentBg: 'bg-sky-100',
    icon: (className) => <AiOutlineCalendar className={className} />,
  },
  booking_confirmed: {
    label: 'Booking confirmed',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-100',
    icon: (className) => <AiOutlineCheckCircle className={className} />,
  },
  booking_cancelled: {
    label: 'Booking cancelled',
    accent: 'text-rose-600',
    accentBg: 'bg-rose-100',
    icon: (className) => <AiOutlineCloseCircle className={className} />,
  },
  listing_approved: {
    label: 'Listing approved',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-100',
    icon: (className) => <AiOutlineCheckCircle className={className} />,
  },
  listing_rejected: {
    label: 'Listing rejected',
    accent: 'text-rose-600',
    accentBg: 'bg-rose-100',
    icon: (className) => <AiOutlineCloseCircle className={className} />,
  },
  listing_deactivated: {
    label: 'Listing deactivated',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-100',
    icon: (className) => <AiOutlineStop className={className} />,
  },
  listing_submitted: {
    label: 'Listing submitted',
    accent: 'text-sky-600',
    accentBg: 'bg-sky-100',
    icon: (className) => <AiOutlineUpload className={className} />,
  },
  listing_revision_requested: {
    label: 'Revision requested',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-100',
    icon: (className) => <AiOutlineUpload className={className} />,
  },
  message_received: {
    label: 'New message',
    accent: 'text-indigo-600',
    accentBg: 'bg-indigo-100',
    icon: (className) => <BiMessageDetail className={className} />,
  },
  review_received: {
    label: 'New review',
    accent: 'text-amber-500',
    accentBg: 'bg-amber-100',
    icon: (className) => <BsStarFill className={className} />,
  },
};

const fallbackMeta: NotificationMeta = {
  label: 'Notification',
  accent: 'text-neutral-600',
  accentBg: 'bg-neutral-100',
  icon: (className) => <AiOutlineBell className={className} />,
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 30 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
};

const loadingSkeletons = Array.from({ length: 4 }, (_, index) => index);

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications?limit=50', {
        credentials: 'include',
      });

      if (response.status === 401) {
        setNotifications([]);
        setError('Sign in to view your notifications.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }

      const data = (await response.json()) as NotificationItem[];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      setError((err as Error).message || 'Unable to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    fetchNotifications();
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          {loadingSkeletons.map((item) => (
            <div
              key={`skeleton-${item}`}
              className="h-20 w-full animate-pulse rounded-xl border border-neutral-100 bg-neutral-50"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          {error}
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center">
          <AiOutlineBell className="h-8 w-8 text-neutral-400" />
          <div>
            <p className="text-sm font-semibold text-neutral-900">No notifications yet</p>
            <p className="mt-1 text-xs text-neutral-500">Interactions with your listings and bookings will appear here.</p>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        {notifications.map((notification) => {
          const meta = notificationMeta[notification.type] ?? fallbackMeta;
          const actorName = notification.actor?.name ?? notification.actor?.username ?? 'Vuola user';
          const actorHandle = notification.actor?.username;

          let timeAgo: string;
          try {
            timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
          } catch {
            timeAgo = '';
          }

          return (
            <motion.article
              key={notification.id}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="group rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex gap-3">
                <div
                  className={clsx(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                    meta.accentBg,
                  )}
                >
                  {meta.icon(clsx('h-5 w-5', meta.accent))}
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{notification.title}</p>
                      <p className="mt-1 text-xs text-neutral-600">{notification.description}</p>
                    </div>
                    {timeAgo && <span className="text-xs text-neutral-400">{timeAgo}</span>}
                  </div>

                  {notification.actor && (
                    <div className="mt-4 flex items-center gap-2">
                      <Avatar
                        src={notification.actor.image ?? undefined}
                        name={actorName}
                        size={32}
                      />
                      <div className="leading-tight">
                        <p className="text-xs font-medium text-neutral-800">{actorName}</p>
                        {actorHandle && (
                          <p className="text-[11px] text-neutral-500">@{actorHandle}</p>
                        )}
                        <p className="mt-1 text-[11px] uppercase tracking-wide text-neutral-400">
                          {meta.label}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    );
  }, [error, isLoading, notifications]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="notifications-backdrop"
            className="fixed inset-0 z-[100] bg-black/30"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.aside
            key="notifications-panel"
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-md flex-col bg-white shadow-2xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <header className="border-b border-neutral-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-neutral-900">Notifications</p>
                  <p className="text-xs text-neutral-500">Stay in sync with bookings, messages, and reviews.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:text-neutral-900"
                  aria-label="Close notifications"
                >
                  <AiOutlineCloseCircle className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              {content}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
