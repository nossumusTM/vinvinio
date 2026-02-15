import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import nodemailer from "nodemailer";

interface IParams {
  listingId?: string;
}

export async function POST(
  req: Request,
  { params }: { params: IParams }
) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse("Not Found", { status: 404 });
  }

  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const listingId = params.listingId;

  if (!listingId || typeof listingId !== "string") {
    return new NextResponse("Invalid listing ID", { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  const rawAttachments = Array.isArray(body?.attachments) ? body.attachments : [];

  type RawAttachment = { name?: unknown; data?: unknown; url?: unknown };
  type SafeAttachment = { name?: string; data?: string; url?: string };

  const attachments: SafeAttachment[] = rawAttachments
    .filter((item: unknown): item is RawAttachment => {
      return typeof item === 'object' && item !== null;
    })
    .slice(0, 4)
    .map((item: RawAttachment): SafeAttachment => ({
      name: typeof item.name === 'string' ? item.name : undefined,
      data: typeof item.data === 'string' ? item.data : undefined,
      url: typeof item.url === 'string' ? item.url : undefined,
    }))
    .filter((item: SafeAttachment) => Boolean(item.data || item.url));

  try {
    // ✅ Update status and include the user
    const listing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'rejected',
        moderationNoteText: note || undefined,
        moderationNoteAttachments: attachments.length ? attachments : undefined,
      },
      include: { user: true },
    });

    // ✅ Send email notification
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const recipientEmail = listing.user?.email;

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
          subject: "❌ Your Service Listing Has Been Rejected",
          html: `
            <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
              <div style="padding: 24px;">
                <img src="https://vinvin.io/images/vuoiaggiologo.png" alt="Vinvin Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />

                <h2 style="text-align: center; color: #c00;">Listing Rejected</h2>
                <p style="font-size: 16px;">Hi ${listing.user.name || "there"},</p>

                <p style="font-size: 14px; margin-bottom: 16px;">
                  Unfortunately, your listing titled <strong>${listing.title}</strong> did not meet our platform guidelines and has been <strong style="color: #c00;">rejected</strong>.
                </p>

                <p style="font-size: 14px;">You may revise the listing and resubmit it for review.</p>

                ${note ? `<div style="margin: 18px 0; padding: 14px; background: #fff5f5; border: 1px solid #ffd6d6; border-radius: 10px;">
                  <p style="font-size: 13px; font-weight: 700; color: #a40000; margin-bottom: 8px;">Moderator notes</p>
                  <p style="font-size: 14px; white-space: pre-line;">${note}</p>
                </div>` : ''}

                <p style="margin-top: 32px;">If you have questions, feel free to contact <a href="mailto:ciao@vuoiaggio.it" style="color: #3604ff;">ciao@vuoiaggio.it</a></p>

                <hr style="margin-top: 40px;" />
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send listing rejection email", emailError);
      }
    } else {
      if (!emailUser || !emailPass) {
        console.warn(
          "Email credentials are not configured; skipping rejection notification email."
        );
      } else if (!recipientEmail) {
        console.warn(
          "Listing rejection notification email skipped: no recipient email available."
        );
      }
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("[REJECT_LISTING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
