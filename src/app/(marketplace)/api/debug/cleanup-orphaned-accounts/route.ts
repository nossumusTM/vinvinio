// app/api/debug/cleanup-orphaned-accounts/route.ts

import { NextResponse } from "next/server";
import prisma from "@/app/(marketplace)/libs/prismadb";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Not Found', { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "moder") {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const users = await prisma.user.findMany({ select: { id: true } });
    const userIds = users.map(u => u.id);

    const result = await prisma.account.deleteMany({
      where: {
        userId: {
          notIn: userIds,
        },
      },
    });

    console.log("🧹 Deleted orphaned accounts:", result);

    return NextResponse.json({
      message: "Cleanup complete",
      deleted: result.count,
    });
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    return new NextResponse("Error cleaning orphaned accounts", { status: 500 });
  }
}
