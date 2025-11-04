import { NextResponse } from 'next/server';
import prisma from '@/app/(marketplace)/libs/prismadb';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';
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
        from: `"Vuola Finance" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: '💸 Host earnings withdrawn successfully',
        html: `
          <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
            <div style="padding: 24px;">
              <img src="https://vuola.eu/images/vuoiaggiologo.png" alt="Vuola Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />
              <h2 style="text-align: center; color: #000;">Host Withdrawal Processed</h2>
              <p style="font-size: 16px;">Hi ${user.name || 'there'},</p>
              <p style="font-size: 14px; margin-bottom: 16px;">
                🎉 Your hosting revenue withdrawal has been processed on <strong>Vuola</strong>.
              </p>
              <p style="font-size: 14px; margin-bottom: 12px;">Your booking and revenue counters have been reset.</p>
              <p style="font-size: 14px;">Thank you for hosting with Vuola! 🧳</p>
              <p style="margin-top: 32px;">— Vuola Team</p>
              <hr style="margin-top: 40px;" />
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
