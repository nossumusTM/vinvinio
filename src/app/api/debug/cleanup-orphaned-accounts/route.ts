// app/api/debug/cleanup-orphaned-accounts/route.ts

import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function GET() {
  try {
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