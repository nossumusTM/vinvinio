import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
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
      listingId
    } = await req.json();

    if (!hostEmail || !guestName || !formattedDateTime || !listingTitle) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const displayGuestName = legalName || guestName;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Vuola Booking" <${process.env.EMAIL_USER}>`,
      to: hostEmail,
      subject: 'New Booking Received on Vuola',
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
        <div style="font-family: 'Nunito', Arial, sans-serif; color: #333;">
          <img src="https://vuola.eu/images/vuoiaggiologo.png" alt="Vuola Logo" style="width: 140px; margin: 24px auto 0; display: block;" />

          <div style="padding: 24px;">
            <p style="font-size: 16px; text-align: left; margin-bottom: 8px;">Dear ${hostName || 'Host'},</p>
            <p style="text-align: left; font-size: 14px; color: #555; margin-bottom: 20px;">
              🎉 A new booking has been made for your experience <strong>${listingTitle}</strong>.
            </p>

            <div style="background: #f3f4f6; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
              <p style="margin: 6px 0;"><strong>Guest Name:</strong> ${guestName}</p>
              ${contact ? `<p style="margin: 6px 0;"><strong>Contact:</strong> ${contact}</p>` : ''}
              <p style="margin: 6px 0;"><strong>Date:</strong> ${formattedDateTime}</p>
              <p style="margin: 6px 0;"><strong>Guests:</strong> ${guests}</p>
              <p style="margin: 6px 0;"><strong>Total Price:</strong> €${total}</p>
            </div>

            <p>Login to your dashboard to see the full details and contact the guest if needed.</p>

            <p style="margin: 6px 0;"><strong>Listing ID:</strong> 
                <a href="https://vuoiaggio.it/listings/${listingId}"
                    style="color: #3604ff; text-decoration: none; font-weight: 600;
                            border-bottom: 2px solid #3604ff; padding-bottom: 2px; display: inline-block;">
                    ${listingId}
                </a>
            </p>

            <p style="margin-top: 32px;">Thanks for hosting with <strong>Vuola</strong>! ✨</p>
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
