import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { name },
      select: { image: true }
    });

    if (!user || !user.image) {
      return new NextResponse("User image not found", { status: 404 });
    }

    return NextResponse.json({ image: user.image });
  } catch (error) {
    console.error("Error fetching user image:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}