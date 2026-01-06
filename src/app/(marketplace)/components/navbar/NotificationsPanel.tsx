'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  AiOutlineBell,
  AiOutlineCalendar,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineClose,
  AiOutlineStop,
  AiOutlineUpload,
} from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { LuChevronRight } from 'react-icons/lu';
import { BsCashCoin, BsStarFill } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import Avatar from '../Avatar';
import useMessenger from '@/app/(marketplace)/hooks/useMessager';

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
  | 'review_received'
  | 'payout_processed'
  | 'referral_booking';

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
  payout_processed: {
    label: 'Payout update',
    accent: 'text-emerald-700',
    accentBg: 'bg-emerald-100',
    icon: (className) => <BsCashCoin className={className} />,
  },
  referral_booking: {
    label: 'Referral booking',
    accent: 'text-violet-600',
    accentBg: 'bg-violet-100',
    icon: (className) => <AiOutlineCalendar className={className} />,
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

const panelVariants: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 30 },
  },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
  },
  dismiss: (seed: number) => ({
    opacity: 0,
    scale: 0.85 - (seed % 3) * 0.02,
    rotate: (seed % 2 ? -1 : 1) * 2,
    y: -6,
    filter: 'blur(2px)',
    transition: { duration: 0.2, ease: [0.2, 0.7, 0.2, 1] as const },
  }),
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
};

const loadingSkeletons = Array.from({ length: 4 }, (_, index) => index);

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const messenger = useMessenger();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pendingDismissals, setPendingDismissals] = useState<Set<string>>(new Set());

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

  const closeAndNavigate = useCallback(
    (href?: string | null) => {
      if (href) {
        router.push(href);
      }
      onClose();
    },
    [onClose, router],
  );

  const handleNotificationClick = useCallback(
    (notification: NotificationItem) => {
      const context = notification.context ?? {};
      const listingId = typeof context.listingId === 'string' ? context.listingId : null;
      const reservationId = typeof context.reservationId === 'string' ? context.reservationId : null;

      switch (notification.type) {
        case 'booking_received': {
          closeAndNavigate('/reservations');
          return;
        }
        case 'booking_confirmed': {
          closeAndNavigate('/trips');
          return;
        }
        case 'booking_cancelled': {
          const description = notification.description.toLowerCase();
          if (description.includes('cancelled their booking')) {
            closeAndNavigate('/reservations');
          } else if (description.includes('confirmed the cancellation')) {
            closeAndNavigate('/trips');
          } else if (reservationId) {
            closeAndNavigate(`/reservations?reservationId=${reservationId}`);
          } else {
            closeAndNavigate('/reservations');
          }
          return;
        }
        case 'listing_approved': {
          closeAndNavigate(listingId ? `/listings/${listingId}` : '/my-listings');
          return;
        }
        case 'listing_rejected': {
          closeAndNavigate('/my-listings?tab=rejected');
          return;
        }
        case 'listing_deactivated': {
          closeAndNavigate('/my-listings?tab=inactive');
          return;
        }
        case 'listing_submitted': {
          closeAndNavigate('/my-listings?tab=pending');
          return;
        }
        case 'listing_revision_requested': {
          closeAndNavigate('/my-listings?tab=revision');
          return;
        }
        case 'message_received': {
          const actor = notification.actor;
          if (actor?.id) {
            messenger.openChat({
              id: actor.id,
              name: actor.name ?? actor.username ?? 'Vuola user',
              image: actor.image ?? undefined,
            });
          } else {
            messenger.openList();
          }
          onClose();
          return;
        }
        case 'review_received': {
          closeAndNavigate(listingId ? `/listings/${listingId}#reviews` : '/listings');
          return;
        }
        case 'payout_processed': {
          closeAndNavigate('/profile#payments-section');
          return;
        }
        default: {
          closeAndNavigate('/profile');
        }
      }
    },
    [closeAndNavigate, messenger, onClose],
  );

  const handleDismissNotification = useCallback(
    async (notificationId: string) => {
      setPendingDismissals((prev) => {
        const next = new Set(prev);
        next.add(notificationId);
        return next;
      });

      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));

      try {
        const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/dismiss`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to dismiss notification');
        }
      } catch (dismissError) {
        console.error('Failed to dismiss notification', dismissError);
        await fetchNotifications();
      } finally {
        setPendingDismissals((prev) => {
          const next = new Set(prev);
          next.delete(notificationId);
          return next;
        });
      }
    },
    [fetchNotifications],
  );

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
            <p className="p-4 mt-1 text-xs text-neutral-500">Interactions with your listings and bookings will appear here.</p>
          </div>
        </div>
      );
    }

    return (
      <motion.div variants={listVariants} initial="hidden" animate="visible" className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
        {notifications.map((notification, idx) => {
          const meta = notificationMeta[notification.type] ?? fallbackMeta;
          const actorName = notification.actor?.name ?? notification.actor?.username ?? 'Vuola user';
          const actorHandle = notification.actor?.username;
          const isDismissPending = pendingDismissals.has(notification.id);

          let timeAgo: string;
          try {
            timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
          } catch {
            timeAgo = '';
          }

          return (
            <motion.div
              key={notification.id}
              layout
              custom={idx}                     // feeds the seed into variants.dismiss
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="dismiss"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationClick(notification)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNotificationClick(notification);
                }
              }}
              className="group relative flex w-full flex-col rounded-2xl border border-neutral-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
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
                  <div className="flex flex-wrap items-start justify-between gap-2 pr-6">
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
                        meta.accent,
                      )}
                    >
                      {meta.label.toUpperCase()}
                    </span>
                    {timeAgo && <span className="text-xs text-neutral-400">{timeAgo}</span>}
                  </div>

                  <p className="mt-3 text-sm font-semibold text-neutral-900">{notification.title}</p>
                  <p className="mt-1 text-xs text-neutral-600">{notification.description}</p>

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
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 transition hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Dismiss notification"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void handleDismissNotification(notification.id);
                }}
                disabled={isDismissPending}
              >
                <AiOutlineClose className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </motion.div>
    );
  }, [error, handleDismissNotification, handleNotificationClick, isLoading, notifications, pendingDismissals]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="notifications-backdrop"
            className=" fixed inset-0 z-[99990] h-screen flex items-start p-3 pointer-events-auto outline-none focus:outline-none bg-black/30 w-full "
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.aside
            key="notifications-panel"
            onClick={(e) => e.stopPropagation()}
            className="fixed right-0 top-0 z-[99999] m-[8px] flex h-[calc(100dvh-16px)] w-fit min-w-md max-w-md flex-col rounded-3xl bg-white shadow-2xl"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut', type: 'tween' }}
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
                  {/* <AiOutlineClose className="h-4 w-4" /> */}
                  <LuChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pr-7">
              {content}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;