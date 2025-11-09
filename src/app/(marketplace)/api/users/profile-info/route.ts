// /app/api/users/profile-info/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";
import { slugSegment } from "@/app/(marketplace)/libs/links";
export const dynamic = 'force-dynamic';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    }) as { contact?: string; address?: string }; // 👈 add address here

    return NextResponse.json({
      contact: user?.contact || '',
      address: user?.address || '', // 👈 include address
    });
  } catch (error) {
    console.error("Error fetching user profile info:", error);
    return new NextResponse("Failed to fetch profile info", { status: 500 });
  }
}

export async function PUT(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.error();

  const body = await req.json();

  const {
    username,
    name,
    email,
    phone,
    contact,
    legalName,
    address, // address will be a stringified JSON
  } = body;

  try {
    const sanitizedUsername = typeof username === 'string' ? slugSegment(username).toLowerCase() : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(sanitizedUsername !== undefined ? { username: sanitizedUsername } : {}),
        name,
        email,
        phone,
        contact,
        legalName,
        address, // Store the full JSON as a string
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile info:", error);
    return new NextResponse("Failed to update user", { status: 500 });
  }
}
