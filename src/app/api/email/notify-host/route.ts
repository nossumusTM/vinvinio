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
      from: `"Vuoiaggio Booking" <${process.env.EMAIL_USER}>`,
      to: hostEmail,
      subject: 'New Booking Received on Vuoiaggio',
      html: `
        <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
          <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
        <div style="font-family: 'Nunito', Arial, sans-serif; color: #333;">
          <img src="https://vuoiaggio.netlify.app/images/vuoiaggiologo.png" alt="Vuoiaggio Logo" style="width: 140px; margin: 24px auto 0; display: block;" />

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
                    style="color: #25F4EE; text-decoration: none; font-weight: 600;
                            border-bottom: 2px solid #25F4EE; padding-bottom: 2px; display: inline-block;">
                    ${listingId}
                </a>
            </p>

            <p style="margin-top: 32px;">Thanks for hosting with <strong>Vuoiaggio</strong>! ✨</p>

            <p style="font-size: 13px; color: #888; margin-top: 40px;">Vuoiaggio International Srls.</p>
            <p style="font-size: 13px; color: #888;">P.IVA 57483813574</p>
            <p style="font-size: 13px; color: #888;">Via Novacella 18, Rome, RM, Italy</p>
            <p style="font-size: 13px; color: #888;">🇮🇹 +39 371 528 4911</p>
            <p style="font-size: 13px; color: #888;">ciao@vuoiaggio.it</p>
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
