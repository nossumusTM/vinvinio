import { NextResponse } from 'next/server';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'moder') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'host') {
      return new NextResponse('User not found or not a host', { status: 404 });
    }

    // ✅ Reset HostAnalytics data
    await prisma.hostAnalytics.updateMany({
      where: { userId },
      data: {
        totalBooks: 0,
        totalRevenue: 0,
      },
    });

    // ✅ Send confirmation email
    if (user.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Vuoiaggio Finance" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: '💸 Host earnings withdrawn successfully',
        html: `
          <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
            <div style="padding: 24px;">
              <img src="https://vuoiaggio.netlify.app/images/vuoiaggiologo.png" alt="Vuoiaggio Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />
              <h2 style="text-align: center; color: #000;">Host Withdrawal Processed</h2>
              <p style="font-size: 16px;">Hi ${user.name || 'there'},</p>
              <p style="font-size: 14px; margin-bottom: 16px;">
                🎉 Your hosting revenue withdrawal has been processed on <strong>Vuoiaggio</strong>.
              </p>
              <p style="font-size: 14px; margin-bottom: 12px;">Your booking and revenue counters have been reset.</p>
              <p style="font-size: 14px;">Thank you for hosting with Vuoiaggio! 🧳</p>
              <p style="margin-top: 32px;">— Vuoiaggio Team</p>
              <hr style="margin-top: 40px;" />
              <p style="font-size: 13px; color: #888;">Vuoiaggio Network Srls.</p>
              <p style="font-size: 13px; color: #888;">P.IVA 57483813574</p>
              <p style="font-size: 13px; color: #888;">Via Novacella 18, Rome, RM, Italy</p>
              <p style="font-size: 13px; color: #888;">🇮🇹 +39 371 528 4911</p>
              <p style="font-size: 13px; color: #888;">ciao@vuoiaggio.it</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ message: `Host withdrawal completed for ${user.name || user.email}` });
  } catch (error) {
    console.error('Host withdraw error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
