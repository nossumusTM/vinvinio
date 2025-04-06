import prisma from "@/app/libs/prismadb";

export const dynamic = 'force-dynamic';
const getReferralBookings = async (refId: string) => {
  try {
    if (!refId) return { totalCount: 0, totalAmount: 0 };

    const bookings = await prisma.reservation.findMany({
      where: { referralId: refId },
      select: { totalPrice: true },
    });

    const totalCount = bookings.length;

    const totalAmount = bookings.reduce(
      (sum: number, res: { totalPrice: number }) => sum + res.totalPrice,
      0
    );

    return { totalCount, totalAmount };
  } catch (error: any) {
    console.error("Error fetching referral bookings:", error);
    return { totalCount: 0, totalAmount: 0 };
  }
};

export default getReferralBookings;