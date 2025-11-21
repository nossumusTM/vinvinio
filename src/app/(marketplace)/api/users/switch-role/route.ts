import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";

export const dynamic = "force-dynamic";

const SWITCHABLE_ROLES: Role[] = ["host", "customer"];

type SwitchRoleBody = {
  targetRole?: Role | string;
};

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as SwitchRoleBody | null;
    const targetRole = body?.targetRole;

    if (!targetRole || typeof targetRole !== "string") {
      return new NextResponse("Missing target role", { status: 400 });
    }

    if (!SWITCHABLE_ROLES.includes(targetRole as Role)) {
      return new NextResponse("Role not supported", { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, role: true, alternateRole: true },
    });

    if (!existingUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (existingUser.role === targetRole) {
      return NextResponse.json({
        role: existingUser.role,
        alternateRole: existingUser.alternateRole ?? null,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        role: targetRole as Role,
        alternateRole: existingUser.role,
      },
      select: {
        role: true,
        alternateRole: true,
      },
    });

    return NextResponse.json({
      role: updatedUser.role,
      alternateRole: updatedUser.alternateRole ?? null,
    });
  } catch (error) {
    console.error("Failed to switch role", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}