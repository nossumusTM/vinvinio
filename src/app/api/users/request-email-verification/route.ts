// app/api/users/request-email-verification/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/libs/prismadb";
import crypto from "crypto";
import { sendVerificationEmail } from "@/app/libs/verificationemail";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove previous tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expires,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verifyLink = `${baseUrl}/verify-email?token=${token}`;

    await sendVerificationEmail(user.email!, verifyLink);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error sending verification email:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}