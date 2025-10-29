import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import nodemailer from "nodemailer";
import { hrefForListing } from "@/app/libs/links";
import { ensureListingSlug } from "@/app/libs/ensureListingSlug";

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

    const listingWithSlug = await ensureListingSlug(listing);

    const listingPath = hrefForListing(listingWithSlug);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || "https://vuoiaggio.it";
    const listingUrl = `${baseUrl}${listingPath.startsWith('/') ? listingPath : `/${listingPath}`}`;

    // ✅ Send email to listing creator
    if (listingWithSlug.user?.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Vuola Moderation" <${process.env.EMAIL_USER}>`,
        to: listingWithSlug.user.email,
        subject: "🎉 Your Experience Listing Has Been Approved!",
        html: `
          <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
            <div style="padding: 24px;">
              <img src="https://vuola.eu/images/vuoiaggiologo.png" alt="Vuoiaggio Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />
              <h2 style="text-align: center;">Your Experience is Now Live! 🚀</h2>
              <p style="font-size: 16px;">Hi ${listingWithSlug.user.name || "there"},</p>
              <p style="font-size: 14px; margin-bottom: 16px;">
                Your listing <strong>${listingWithSlug.title}</strong> has been approved and is now live on Vuola.
              </p>
              <p style="font-size: 14px;">Guests can now discover and book your experience!</p>
              <p style="margin-top: 32px;">Thank you for being part of the Vuola community! ✨</p>

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
    }

    return NextResponse.json(listingWithSlug);
  } catch (error) {
    console.error("[APPROVE_LISTING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}