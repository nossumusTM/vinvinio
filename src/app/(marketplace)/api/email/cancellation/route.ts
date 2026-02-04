import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const body = await req.json();
  const { to, subject, bodyText } = body;

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