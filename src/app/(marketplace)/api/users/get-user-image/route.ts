// app/api/users/get-user-image/route.ts

export const dynamic = "force-dynamic"; // 🛡️ This disables static optimization

import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: "insensitive" } },
        ],
      },
      select: {
        image: true,
        name: true,
        id: true,
      },
    });

    if (!user || !user.image) {
      return NextResponse.json({ image: null });
    }

    return NextResponse.json({ image: user.image });
  } catch (err) {
    console.error("🔥 Error in get-user-image API:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}