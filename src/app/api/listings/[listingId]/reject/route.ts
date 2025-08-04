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

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const listingId = params.listingId;

  if (!listingId || typeof listingId !== "string") {
    return new NextResponse("Invalid listing ID", { status: 400 });
  }

  try {
    // ✅ Update status and include the user
    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'rejected' },
      include: { user: true },
    });

    // ✅ Send email notification
    if (listing.user?.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Vuola Moderation" <${process.env.EMAIL_USER}>`,
        to: listing.user.email,
        subject: '❌ Your Experience Listing Has Been Rejected',
        html: `
          <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
            <div style="padding: 24px;">
              <img src="https://vuola.eu/images/vuoiaggiologo.png" alt="Vuola Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />

              <h2 style="text-align: center; color: #c00;">Listing Rejected</h2>
              <p style="font-size: 16px;">Hi ${listing.user.name || 'there'},</p>

              <p style="font-size: 14px; margin-bottom: 16px;">
                Unfortunately, your listing titled <strong>${listing.title}</strong> did not meet our platform guidelines and has been <strong style="color: #c00;">rejected</strong>.
              </p>

              <p style="font-size: 14px;">You may revise the listing and resubmit it for review.</p>

              <p style="margin-top: 32px;">If you have questions, feel free to contact <a href="mailto:ciao@vuoiaggio.it" style="color: #3604ff;">ciao@vuoiaggio.it</a></p>

              <hr style="margin-top: 40px;" />
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("[REJECT_LISTING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}