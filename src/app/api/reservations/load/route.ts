import { NextResponse } from "next/server";
import getReservations from "@/app/actions/getReservations";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const take = parseInt(searchParams.get("take") || "4", 10);

  try {
    const reservations = await getReservations({
      authorId: currentUser.id,
      skip,
      take,
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error("❌ Load More API Error:", error);
    return new NextResponse("Failed to load more reservations", { status: 500 });
  }
}