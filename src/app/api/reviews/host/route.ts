// app/api/reviews/host/route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(req: Request) {
  const { hostId } = await req.json();

  if (!hostId) return NextResponse.json([], { status: 200 });

  const reviews = await prisma.review.findMany({
    where: {
      listing: {
        userId: hostId,
      },
    },
    select: {
      rating: true,
    },
  });

  return NextResponse.json(reviews);
}