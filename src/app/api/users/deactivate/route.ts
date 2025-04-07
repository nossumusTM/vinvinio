// /app/api/users/deactivate/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
export const dynamic = 'force-dynamic';

export async function DELETE() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.error();

  try {
    await prisma.user.delete({
      where: { id: currentUser.id },
    });

    return new NextResponse("Account deactivated", { status: 200 });
  } catch (error) {
    console.error("Error deactivating account:", error);
    return new NextResponse("Failed to deactivate account", { status: 500 });
  }
}