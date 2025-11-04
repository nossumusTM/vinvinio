// import { NextResponse } from 'next/server';
// import prisma from '@/app/libs/prismadb';
//  import getCurrentUser from  '@/app/actions/getCurrentUser';
// export const dynamic = 'force-dynamic';

// export async function POST(req: Request) {
//   const currentUser = await getCurrentUser();
//   if (!currentUser || currentUser.role !== 'moder') {
//     return new NextResponse('Unauthorized', { status: 401 });
//   }

//   const body = await req.json();
//   const { userId } = body;

//   if (!userId) {
//     return new NextResponse('Missing userId', { status: 400 });
//   }

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user || user.role !== 'promoter' && user.role !== 'customer') {
//       return new NextResponse('User not found or not a moder', { status: 404 });
//     }

//     await prisma.referralAnalytics.update({
//       where: { userId },
//       data: {
//         totalBooks: 0,
//         qrScans: 0,
//         totalRevenue: 0,
//       }
//     });

//     return NextResponse.json({ message: `Withdraw completed for ${user.name || user.email}` });
//   } catch (error) {
//     console.error('Withdraw error:', error);
//     return new NextResponse('Internal Server Error', { status: 500 });
//   }
// }

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

    if (!user || (user.role !== 'promoter' && user.role !== 'customer')) {
      return new NextResponse('User not found or not eligible', { status: 404 });
    }

    await prisma.referralAnalytics.update({
      where: { userId },
      data: {
        totalBooks: 0,
        qrScans: 0,
        totalRevenue: 0,
      }
    });

    // ✅ Send notification email
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
        subject: '💸 Your referral earnings have been withdrawn',
        html: `
          <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
            <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" rel="stylesheet">
            <div style="padding: 24px;">
              <img src="https://vuola.eu/images/vuoiaggiologo.png" alt="Vuola Logo" style="width: 140px; margin: 0 auto 20px; display: block;" />

              <h2 style="text-align: center; color: #000;">Withdrawal Complete</h2>
              <p style="font-size: 16px;">Hi ${user.name || 'there'},</p>

              <p style="font-size: 14px; margin-bottom: 16px;">
                🎉 We’ve successfully processed your referral earnings withdrawal on <strong>Vuola</strong>.
              </p>

              <p style="font-size: 14px; margin-bottom: 12px;">Your totalBooks, qrScans, and totalRevenue counters have been reset.</p>

              <p style="font-size: 14px;">Thank you for promoting experiences with us! 🚀</p>

              <p style="margin-top: 32px;">— Vuola Team</p>

              <hr style="margin-top: 40px;" />
            </div>
          </div>
        `,
      }).then(info => {
        console.log("📨 Email sent:", info.messageId);
      }).catch(err => {
        console.error("❌ Failed to send email:", err);
      });
    }

    return NextResponse.json({ message: `Withdraw completed for ${user.name || user.email}` });
  } catch (error) {
    console.error('Withdraw error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}