import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import nodemailer from "nodemailer";
import { hrefForListing } from "@/app/(marketplace)/libs/links";
import { ensureListingSlug } from "@/app/(marketplace)/libs/ensureListingSlug";
import { ensureListingApprovalPunti } from "@/app/(marketplace)/libs/partnerMetrics";

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

    await ensureListingApprovalPunti(listingId);
    const listingWithSlug = await ensureListingSlug(listing);

    const listingPath = hrefForListing(listingWithSlug);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://vuoiaggio.it";
    const listingUrl = `${baseUrl}${listingPath.startsWith('/') ? listingPath : `/${listingPath}`}`;

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const recipientEmail = listingWithSlug.user?.email;

    if (emailUser && emailPass && recipientEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: `"Vinvin Moderation" <${emailUser}>`,
          to: recipientEmail,
          subject: "🎉 Your Experience Listing Has Been Approved!",
          html: `
            <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
              <div style="padding: 24px;">
                <img src="https://vinvin.io/images/vuoiaggiologo.png" alt="Vuoiaggio Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />
                <h2 style="text-align: center;">Your Experience is Now Live! 🚀</h2>
                <p style="font-size: 16px;">Hi ${listingWithSlug.user?.name || "there"},</p>
                <p style="font-size: 14px; margin-bottom: 16px;">
                  Your listing <strong>${listingWithSlug.title}</strong> has been approved and is now live on Vinvin.
                </p>
                <p style="font-size: 14px;">Guests can now discover and book your experience!</p>
                <p style="margin-top: 32px;">Thank you for being part of the Vinvin community! ✨</p>

                <p style="margin: 6px 0;"><strong>View your listing:</strong>
                  <a href="${listingUrl}"
                    style="color: #3604ff; text-decoration: none; font-weight: 600;
                           border-bottom: 2px solid #3604ff; padding-bottom: 2px; display: inline-block;">
                    ${listingWithSlug.title}
                  </a>
                </p>

                <hr style="margin-top: 40px;" />
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send listing approval email", emailError);
      }
    } else {
      if (!emailUser || !emailPass) {
        console.warn("Email credentials are not configured; skipping approval notification email.");
      } else if (!recipientEmail) {
        console.warn("Listing approval notification email skipped: no recipient email available.");
      }
    }

    return NextResponse.json(listingWithSlug);
  } catch (error) {
    console.error("[APPROVE_LISTING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}