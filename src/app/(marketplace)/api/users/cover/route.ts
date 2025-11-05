// /app/(marketplace)/api/users/cover/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import { uploadImageToCloudinary } from "@/app/(marketplace)/utils/uploadImageToCloudinary";

export const dynamic = "force-dynamic";

// GET /api/users/cover?userId=abc
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    let targetUserId = userIdParam ?? null;
    if (!targetUserId) {
      const me = await getCurrentUser();
      if (!me) return new NextResponse("Unauthorized", { status: 401 });
      targetUserId = me.id;
    }

    const user = await prisma.user.findFirst({
      where: { id: targetUserId },
      select: { coverImage: true },
    });

    return NextResponse.json({ coverImage: user?.coverImage ?? null });
  } catch {
    return new NextResponse("Server error", { status: 500 });
  }
}

// PUT /api/users/cover    body: { image: base64 | dataURL }
export async function PUT(request: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return new NextResponse("Unauthorized", { status: 401 });

    const body = await request.json();
    let { image } = body as { image?: string };

    if (!image || typeof image !== "string") {
      return new NextResponse("No image provided", { status: 400 });
    }

    // Ensure dataURL for the uploader
    if (!image.startsWith("data:image/")) {
      image = `data:image/jpeg;base64,${image}`;
    }

    const url = await uploadImageToCloudinary(image);

    // Use updateMany to avoid composite-unique requirement
    await prisma.user.updateMany({
      where: { id: me.id },
      data: { coverImage: url },
    });

    return NextResponse.json({ success: true, coverImage: url });
  } catch {
    return new NextResponse("Image upload failed", { status: 500 });
  }
}