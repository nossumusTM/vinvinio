// app/libs/verificationemail.ts

import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (to: string, link: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Vuoiaggio Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; text-align: center; padding: 40px 24px;">
        <img 
          src="https://vuoiaggio.netlify.app/images/vuoiaggiologo.png" 
          alt="Vuoiaggio Logo" 
          style="width: 140px; margin-bottom: 32px;" 
        />

        <h2 style="margin-bottom: 16px;">Email Verification</h2>
        <p>Click the button below to verify your email address and activate your Vuoiaggio account.</p>

        <a href="${link}" style="display: inline-block; padding: 12px 20px; background-color: black; color: white; text-decoration: none; border-radius: 6px; margin: 24px auto;">
          Verify Email
        </a>

        <p style="margin-top: 32px; color: #777;">If you didn’t create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
};