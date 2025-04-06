// /app/api/users/update-password/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/app/libs/prismadb';
import getCurrentUser from '@/app/actions/getCurrentUser';
import { getSession } from 'next-auth/react';

export async function PUT(req: Request) {
  try {
    // const currentUser = await getCurrentUser();

    const session = await getSession();
    const currentUser = await prisma.user.findUnique({
      where: { email: session?.user?.email as string },
    });

    if (!currentUser || !currentUser.email || !currentUser.hashedPassword) {
      return new NextResponse("Unauthorized or invalid user", { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return new NextResponse("All fields are required", { status: 400 });
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      return new NextResponse("Passwords do not match", { status: 400 });
    }

    const isCorrect = await bcrypt.compare(currentPassword, currentUser.hashedPassword);

    if (!isCorrect) {
      return new NextResponse("Current password is incorrect", { status: 401 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email: currentUser.email },
      data: {
        hashedPassword: hashedNewPassword,
      },
    });

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error("Error updating password:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
