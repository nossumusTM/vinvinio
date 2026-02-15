import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import prisma from '@/app/(marketplace)/libs/prismadb';
import { ensureListingSlug } from '@/app/(marketplace)/libs/ensureListingSlug';
import { hrefForListing } from '@/app/(marketplace)/libs/links';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const internalToken = process.env.INTERNAL_API_TOKEN;
    const headerToken = req.headers.get('x-internal-api-token');
    const hasValidInternalToken =
      Boolean(internalToken) &&
      typeof headerToken === 'string' &&
      headerToken.length > 0 &&
      headerToken === internalToken;

    // If INTERNAL_API_TOKEN is configured, require either an authenticated user
    // or a valid internal token for server-to-server calls.
    if (!currentUser && internalToken && !hasValidInternalToken) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const {
      hostEmail,
      hostName,
      guestName,
      legalName,
      contact,
      total,
      guests,
      formattedDateTime,
      listingTitle,
      listingId,
      listingPath
    } = await req.json();

    if (!hostEmail || !guestName || !formattedDateTime || !listingTitle) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://vuoiaggio.it";

    let resolvedPath: string | null =
      typeof listingPath === 'string' && listingPath.length > 0 ? listingPath : null;

    if (!resolvedPath && listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (listing) {
        const ensured = await ensureListingSlug(listing as any);
        resolvedPath = hrefForListing(ensured);
      }
    }

    if (!resolvedPath && listingId) {
      resolvedPath = `/services/general/${encodeURIComponent(listingId)}`;
    }

    const listingUrl = `${baseUrl}${resolvedPath && resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath ?? ''}`}`;

    const info = await transporter.sendMail({
      from: `"Vinvin Booking" <${process.env.EMAIL_USER}>`,
      to: hostEmail,
      subject: 'New Booking Received on Vinvin',
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
        <div style="font-family: 'Nunito', Arial, sans-serif; color: #333;">
          <img src="https://vinvin.io/images/vuoiaggiologo.png" alt="Vinvin Logo" style="width: 140px; margin: 24px auto 0; display: block;" />

          <div style="padding: 24px;">
            <p style="font-size: 16px; text-align: left; margin-bottom: 8px;">Dear ${hostName || 'Host'},</p>
            <p style="text-align: left; font-size: 14px; color: #555; margin-bottom: 20px;">
              🎉 A new booking has been made for your service <strong>${listingTitle}</strong>.
            </p>

            <div style="background: #f3f4f6; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 6px 0;"><strong>Guest Name:</strong> ${guestName}</p>
              ${contact ? `<p style="margin: 6px 0;"><strong>Contact:</strong> ${contact}</p>` : ''}
              <p style="margin: 6px 0;"><strong>Date:</strong> ${formattedDateTime}</p>
              <p style="margin: 6px 0;"><strong>Guests:</strong> ${guests}</p>
              <p style="margin: 6px 0;"><strong>Total Price:</strong> $${total}</p>
            </div>

            <p>Login to your dashboard to see the full details and contact the guest if needed.</p>

            <p style="margin: 6px 0;"><strong>Listing:</strong>
                <a href="${listingUrl}"
                    style="color: #3604ff; text-decoration: none; font-weight: 600;
                            border-bottom: 2px solid #3604ff; padding-bottom: 2px; display: inline-block;">
                    ${listingTitle}
                </a>
                ${listingId ? `<span style="display: inline-block; margin-left: 8px; color: #6b7280; font-size: 12px;">ID: ${listingId}</span>` : ''}
            </p>

            <p style="margin-top: 32px;">Thanks for hosting with <strong>Vinvin</strong>! ✨</p>
          </div>
        </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send host notification:', error);
    return new NextResponse('Failed to send host email', { status: 500 });
  }
}
