// /app/api/users/profile-info/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
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
    name,
    email,
    phone,
    contact,
    legalName,
    address, // address will be a stringified JSON
  } = body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
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
