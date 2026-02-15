import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { to, subject, bodyText } = body;

  if (!to || !subject || !bodyText) {
    return new NextResponse('Missing required email fields', { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Vinvin Services Network." <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: bodyText, // plain text fallback
      html: `<pre>${bodyText}</pre>`, // render readable email
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Email send error:', error);
    return NextResponse.json({ error: 'Failed to send cancellation email' }, { status: 500 });
  }
}
