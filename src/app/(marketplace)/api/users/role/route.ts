import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";

export const dynamic = "force-dynamic";

const SWITCHABLE_ROLES: Role[] = ["host", "customer"];

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { targetRole?: Role | string }
      | null;

    const targetRole = body?.targetRole;

    if (!targetRole || typeof targetRole !== "string") {
      return new NextResponse("Missing target role", { status: 400 });
    }

    if (!SWITCHABLE_ROLES.includes(targetRole as Role)) {
      return new NextResponse("Role not supported", { status: 400 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, role: true, alternateRole: true },
    });

    if (!userRecord) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (userRecord.role === targetRole) {
      return NextResponse.json({
        role: userRecord.role,
        alternateRole: userRecord.alternateRole ?? null,
      });
    }

    const canSwitchToHost =
      targetRole === "host" &&
      (userRecord.role === "host" || userRecord.alternateRole === "host");
    const canSwitchToGuest =
      targetRole === "customer" &&
      (userRecord.role === "host" ||
        userRecord.role === "customer" ||
        userRecord.alternateRole === "customer");

    if (targetRole === "host" && !canSwitchToHost) {
      return new NextResponse("Host mode unavailable", { status: 403 });
    }

    if (targetRole === "customer" && !canSwitchToGuest) {
      return new NextResponse("Guest mode unavailable", { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        role: targetRole as Role,
        alternateRole: userRecord.role,
      },
      select: {
        role: true,
        alternateRole: true,
      },
    });

    return NextResponse.json({
      role: updated.role,
      alternateRole: updated.alternateRole ?? null,
    });
  } catch (error) {
    console.error("Failed to switch user role", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}