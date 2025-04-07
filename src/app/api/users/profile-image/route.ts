// /api/users/profile-image/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const { image } = body;

  if (!image) return new NextResponse("No image provided", { status: 400 });

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { image },
  });

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name) return new NextResponse("Missing name", { status: 400 });

  const user = await prisma.user.findFirst({
    where: { name },
    select: { image: true },
  });

  return NextResponse.json({
    image: user?.image || "/images/placeholder.jpg",
  });
}