import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { guestEmail, listingId } = await req.json();

  if (!guestEmail || !listingId) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Vinvin" <${process.env.EMAIL_USER}>`,
    to: guestEmail,
    subject: 'Reservation Cancelled – Vinvin',
    html: `
      <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
        <div style="padding: 24px;">
          <img src="https://vinvin.io/images/vuoiaggiologo.png" alt="Vinvin Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />
  
          <h2 style="text-align: center; color: #000;">Your Reservation Has Been Cancelled</h2>
          <p style="font-size: 16px;">Hi there,</p>
  
          <p style="font-size: 14px; margin-bottom: 16px;">
            Your reservation has been cancelled. If you believe this was an error, or if you'd like to request a refund, please review our refund policy and contact the Operator directly.
          </p>
  
          <div style="background: #f9f9f9; padding: 16px 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="font-size: 14px;"><strong>🛑 Important:</strong></p>
            <p style="font-size: 14px; color: #555;">
              Refund policies may apply. Please log into your <strong>Vinvin</strong> account and use the <strong>Messenger</strong> to contact the Operator.
            </p>
            <p style="font-size: 14px; color: #555;">
              Include this <strong>Listing ID</strong> in your message:
              <br /><code style="color: #3604ff; font-weight: bold;">${listingId}</code>
            </p>
          </div>
  
          <p style="margin-top: 32px;">Thank you for using <strong>Vinvin</strong>.</p>
  
          <hr style="margin-top: 40px;" />
        </div>
      </div>
    `
  });  

  return NextResponse.json({ message: "Email sent" });
}
