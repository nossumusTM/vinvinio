import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";

interface Params {
  hostId?: string;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const hostId = params.hostId;

  if (!hostId) {
    return new NextResponse("Host ID is required", { status: 400 });
  }

  if (hostId === currentUser.id) {
    return new NextResponse("Cannot follow yourself", { status: 400 });
  }

  const host = await prisma.user.findUnique({ where: { id: hostId } });

  if (!host) {
    return new NextResponse("Host not found", { status: 404 });
  }

  try {
    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        hostId,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      const followersCount = host.followersCount ?? 0;
      return NextResponse.json({ followed: true, followersCount });
    }
    console.error("[HOST_FOLLOW_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }

  const updatedHost = await prisma.user.update({
    where: { id: hostId },
    data: {
      followersCount: { increment: 1 },
    },
    select: { followersCount: true },
  });

  return NextResponse.json({ followed: true, followersCount: updatedHost.followersCount });
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const hostId = params.hostId;

  if (!hostId) {
    return new NextResponse("Host ID is required", { status: 400 });
  }

  if (hostId === currentUser.id) {
    return new NextResponse("Cannot unfollow yourself", { status: 400 });
  }

  const deletion = await prisma.follow.deleteMany({
    where: {
      followerId: currentUser.id,
      hostId,
    },
  });

  if (deletion.count === 0) {
    return NextResponse.json({ followed: false, followersCount: hostId ? undefined : 0 });
  }

  const host = await prisma.user.findUnique({ where: { id: hostId }, select: { followersCount: true } });
  const nextCount = Math.max(0, (host?.followersCount ?? 0) - deletion.count);

  const updatedHost = await prisma.user.update({
    where: { id: hostId },
    data: {
      followersCount: nextCount,
    },
    select: { followersCount: true },
  });

  return NextResponse.json({ followed: false, followersCount: updatedHost.followersCount });
}