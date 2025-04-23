// /api/users/profile-image/route.ts
import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { uploadImageToCloudinary } from "@/app/utils/uploadImageToCloudinary";
export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  let { image } = body;

  if (!image || typeof image !== 'string') {
    return new NextResponse("No image provided", { status: 400 });
  }

  // ✅ Upload base64 to Cloudinary and get back URL
  if (image.startsWith('data:image/')) {
    try {
      image = await uploadImageToCloudinary(image);
    } catch (err) {
      return new NextResponse("Image upload failed", { status: 500 });
    }
  }

  // ✅ Save image URL to database
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { image },
  });

  return NextResponse.json({ success: true, image });
}

export async function POST(req: Request) {
  const { name } = await req.json();

  if (!name) return new NextResponse("Missing name", { status: 400 });

  const user = await prisma.user.findFirst({
    where: { name },
    select: { image: true },
  });

  return NextResponse.json({
    image: user?.image || null,
  });
}