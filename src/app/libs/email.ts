// app/libs/email.ts

import nodemailer from 'nodemailer';

export const sendResetPasswordEmail = async (to: string, link: string) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,   // e.g. your Gmail address
        pass: process.env.EMAIL_PASS,   // e.g. your Gmail app password
      },
    });

  await transporter.sendMail({
    from: `"Vuola Support" <${process.env.EMAIL_SERVER_USER}>`,
    to,
    subject: 'Reset Your Password',
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; text-align: center; padding: 40px 24px;">
            <img 
            src="https://vuoiaggio.netlify.app/images/vuoiaggiologo.png" 
            alt="Vuola Logo" 
            style="width: 140px; margin-bottom: 32px;" 
            />

            <h2 style="margin-bottom: 16px;">Password Reset Request</h2>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>

            <a href="${link}" style="display: inline-block; padding: 12px 20px; background-color: black; color: white; text-decoration: none; border-radius: 6px; margin: 24px auto;">
            Reset Password
            </a>

            <p style="margin-top: 32px; color: #777;">If you didn’t request this, you can safely ignore this email.</p>
        </div>
    `,
  });
};