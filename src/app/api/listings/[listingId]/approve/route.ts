import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import nodemailer from "nodemailer";

interface IParams {
  listingId?: string;
}

export async function POST(
  req: Request,
  { params }: { params: IParams }
) {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "moder") {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const listingId = params.listingId;

  if (!listingId || typeof listingId !== "string") {
    return new NextResponse("Invalid listing ID", { status: 400 });
  }

  try {
    // ✅ Fetch the listing with its creator
    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { status: "approved" },
      include: { user: true },
    });

    // ✅ Send email to listing creator
    if (listing.user?.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Vuoiaggio Moderation" <${process.env.EMAIL_USER}>`,
        to: listing.user.email,
        subject: "🎉 Your Experience Listing Has Been Approved!",
        html: `
          <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
            <div style="padding: 24px;">
              <img src="https://vuoiaggio.netlify.app/images/vuoiaggiologo.png" alt="Vuoiaggio Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />
              <h2 style="text-align: center;">Your Experience is Now Live! 🚀</h2>
              <p style="font-size: 16px;">Hi ${listing.user.name || "there"},</p>
              <p style="font-size: 14px; margin-bottom: 16px;">
                Your listing <strong>${listing.title}</strong> has been approved and is now live on Vuoiaggio.
              </p>
              <p style="font-size: 14px;">Guests can now discover and book your experience!</p>
              <p style="margin-top: 32px;">Thank you for being part of the Vuoiaggio community! ✨</p>

              <p style="margin: 6px 0;"><strong>View your listing:</strong> 
                <a href="https://vuoiaggio.it/listings/${listing.id}" 
                  style="color: #3604ff; text-decoration: none; font-weight: 600;
                         border-bottom: 2px solid #3604ff; padding-bottom: 2px; display: inline-block;">
                  ${listing.title}
                </a>
              </p>

              <hr style="margin-top: 40px;" />
              <p style="font-size: 13px; color: #888;">Vuoiaggio International Srls.</p>
              <p style="font-size: 13px; color: #888;">Via Novacella 18, Rome, RM, Italy</p>
              <p style="font-size: 13px; color: #888;">🇮🇹 +39 371 528 4911</p>
              <p style="font-size: 13px; color: #888;">ciao@vuoiaggio.it</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("[APPROVE_LISTING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}