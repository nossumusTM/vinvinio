import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";

export const dynamic = "force-dynamic";

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
    const result = await prisma.$transaction(async (tx) => {
      const existingFollow = await tx.follow.findUnique({
        where: {
          followerId_hostId: {
            followerId: currentUser.id,
            hostId,
          },
        },
      });

      if (existingFollow) {
        const followersCount = await tx.user.findUnique({
          where: { id: hostId },
          select: { followersCount: true },
        });

        return { followed: true, followersCount: followersCount?.followersCount ?? 0 };
      }

      await tx.follow.create({
        data: {
          followerId: currentUser.id,
          hostId,
        },
      });

      const updatedHost = await tx.user.update({
        where: { id: hostId },
        data: {
          followersCount: { increment: 1 },
        },
        select: { followersCount: true },
      });

      return { followed: true, followersCount: updatedHost.followersCount };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[HOST_FOLLOW_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deletion = await tx.follow.deleteMany({
        where: {
          followerId: currentUser.id,
          hostId,
        },
      });

      if (deletion.count === 0) {
        const followersCount = await tx.user.findUnique({
          where: { id: hostId },
          select: { followersCount: true },
        });

        return { followed: false, followersCount: followersCount?.followersCount ?? 0 };
      }

      const host = await tx.user.findUnique({ where: { id: hostId }, select: { followersCount: true } });
      const nextCount = Math.max(0, (host?.followersCount ?? 0) - deletion.count);

      const updatedHost = await tx.user.update({
        where: { id: hostId },
        data: {
          followersCount: nextCount,
        },
        select: { followersCount: true },
      });

      return { followed: false, followersCount: updatedHost.followersCount };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[HOST_FOLLOW_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}