// app/api/email/booking/route.ts

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import getCurrentUser from '@/app/(marketplace)/actions/getCurrentUser';

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { to, subject, html } = body;

  if (!to || !subject || !html) {
    return new NextResponse('Missing required fields', { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Vinvin Services Network." <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
