import { NextResponse } from 'next/server';
import { ListingStatus, ReservationStatus } from '@prisma/client';

import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
import prisma from '@/app/(marketplace)/libs/prismadb';

export const dynamic = 'force-dynamic';

const formatShortDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const formatDateRange = (start: Date, end: Date) =>
  `${formatShortDate(start)} - ${formatShortDate(end)}`;

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
};

type Actor = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

type NotificationType =
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

type NotificationResponse = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  actor: Actor | null;
  context?: Record<string, unknown>;
};

const mapUserToActor = (user?: {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
} | null): Actor | null => {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name ?? null,
    username: user.username ?? null,
    image: user.image ?? null,
  };
};

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 100) : 50;
  const fetchWindow = Math.min(limit * 3, 300);

  try {
    const [hostReservations, guestReservations, listings, messages, reviews, dismissals] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          listing: {
            userId: currentUser.id,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: fetchWindow,
      }),
      prisma.reservation.findMany({
        where: {
          userId: currentUser.id,
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: fetchWindow,
      }),
      prisma.listing.findMany({
        where: {
          userId: currentUser.id,
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: fetchWindow,
      }),
      prisma.message.findMany({
        where: {
          recipientId: currentUser.id,
        },
        select: {
          id: true,
          text: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: fetchWindow,
      }),
      prisma.review.findMany({
        where: {
          listing: {
            userId: currentUser.id,
          },
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: fetchWindow,
      }),
      prisma.notificationDismissal.findMany({
        where: {
          userId: currentUser.id,
        },
        select: {
          notificationId: true,
        },
      }),
    ]);

    const dismissedIds = new Set(dismissals.map((dismissal) => dismissal.notificationId));
    const notifications: NotificationResponse[] = [];

    const pushNotification = (notification: NotificationResponse) => {
      if (dismissedIds.has(notification.id)) {
        return;
      }

      notifications.push(notification);
    };

    const pushReservationNotification = (
      reservation: (typeof hostReservations)[number],
      type: NotificationType,
      title: string,
      description: string,
      actorSource: 'guest' | 'host',
    ) => {
      const actor = actorSource === 'guest' ? mapUserToActor(reservation.user) : mapUserToActor(reservation.listing?.user);

      pushNotification({
        id: `reservation-${type}-${reservation.id}-${actorSource}`,
        type,
        title,
        description,
        actor,
        createdAt: reservation.createdAt.toISOString(),
        context: {
          reservationId: reservation.id,
          listingId: reservation.listing?.id,
          listingTitle: reservation.listing?.title,
          status: reservation.status,
        },
      });
    };

    hostReservations.forEach((reservation) => {
      const { listing } = reservation;
      const listingTitle = listing?.title ?? 'Your listing';
      const guestName = reservation.user?.name ?? reservation.user?.username ?? 'a guest';
      const stayRange = formatDateRange(reservation.startDate, reservation.endDate);

      if (reservation.status === ReservationStatus.cancelled) {
        pushReservationNotification(
          reservation,
          'booking_cancelled',
          'Booking cancelled',
          `${guestName} cancelled their booking for ${listingTitle}.`,
          'guest',
        );
        return;
      }

      pushReservationNotification(
        reservation,
        'booking_received',
        'New booking received',
        `${guestName} booked ${listingTitle} (${stayRange}).`,
        'guest',
      );
    });

    guestReservations.forEach((reservation) => {
      const { listing } = reservation;
      const listingTitle = listing?.title ?? 'your experience';
      const hostName = listing?.user?.name ?? listing?.user?.username ?? 'the host';
      const stayRange = formatDateRange(reservation.startDate, reservation.endDate);

      if (reservation.status === ReservationStatus.cancelled) {
        pushReservationNotification(
          reservation,
          'booking_cancelled',
          'Booking cancelled',
          `${hostName} confirmed the cancellation for ${listingTitle}.`,
          'host',
        );
        return;
      }

      pushReservationNotification(
        reservation,
        'booking_confirmed',
        'Booking confirmed',
        `${hostName} confirmed your booking for ${listingTitle} (${stayRange}).`,
        'host',
      );
    });

    const listingStatusMap: Record<ListingStatus, NotificationType> = {
      pending: 'listing_submitted',
      approved: 'listing_approved',
      rejected: 'listing_rejected',
      revision: 'listing_revision_requested',
      inactive: 'listing_deactivated',
      awaiting_reapproval: 'listing_revision_requested',
    };

    listings.forEach((listing) => {
      const statusType = listingStatusMap[listing.status];
      const actor = mapUserToActor(listing.user);
      const baseTitle = (() => {
        switch (statusType) {
          case 'listing_approved':
            return 'Listing approved';
          case 'listing_rejected':
            return listing.status === 'revision' ? 'Revision requested' : 'Listing rejected';
          case 'listing_deactivated':
            return 'Listing deactivated';
          case 'listing_submitted':
            return 'Listing submitted';
          case 'listing_revision_requested':
            return 'Revision requested';
          default:
            return 'Listing update';
        }
      })();

      const description = (() => {
        switch (statusType) {
          case 'listing_approved':
            return `${listing.title} is now live and ready for guests.`;
          case 'listing_rejected':
            return `${listing.title} requires changes before it can go live.`;
          case 'listing_deactivated':
            return `${listing.title} has been deactivated and is hidden from search.`;
          case 'listing_submitted':
            return `You submitted ${listing.title} for review.`;
          case 'listing_revision_requested':
            return `Updates are needed for ${listing.title} before it can be approved.`;
          default:
            return `${listing.title} has a new status update.`;
        }
      })();

      const timestamp =
        statusType === 'listing_submitted'
          ? listing.createdAt.toISOString()
          : listing.updatedAt.toISOString();

      pushNotification({
        id: `listing-${listing.id}-${listing.status}`,
        type: statusType,
        title: baseTitle,
        description,
        actor,
        createdAt: timestamp,
        context: {
          listingId: listing.id,
          status: listing.status,
        },
      });
    });

    messages.forEach((message) => {
      const senderName = message.sender?.name ?? message.sender?.username ?? 'A user';
      pushNotification({
        id: `message-${message.id}`,
        type: 'message_received',
        title: `New message from ${senderName}`,
        description: truncate(message.text, 140),
        actor: mapUserToActor(message.sender),
        createdAt: message.createdAt.toISOString(),
        context: {
          messageId: message.id,
        },
      });
    });

    reviews.forEach((review) => {
      const reviewerName = review.user?.name ?? review.user?.username ?? 'A guest';
      pushNotification({
        id: `review-${review.id}`,
        type: 'review_received',
        title: 'New review received',
        description: `${reviewerName} left a ${review.rating}-star review for ${review.listing?.title ?? 'your listing'}.`,
        actor: mapUserToActor(review.user),
        createdAt: review.createdAt.toISOString(),
        context: {
          listingId: review.listing?.id,
          rating: review.rating,
        },
      });
    });

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(notifications.slice(0, limit));
  } catch (error) {
    console.error('Failed to load notifications', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}
