import { NextResponse } from "next/server";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import prisma from "@/app/(marketplace)/libs/prismadb";
import { BASE_CURRENCY } from "@/app/(marketplace)/constants/locale";

export const dynamic = "force-dynamic";

const normalizeCurrency = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length > 0 ? trimmed : null;
};

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const existing = await prisma.giftVoucher.findUnique({
      where: { userId: currentUser.id },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const created = await prisma.giftVoucher.create({
      data: {
        userId: currentUser.id,
        name: "Vin Voucher",
        balance: 0,
        currency: BASE_CURRENCY,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error fetching gift voucher:", error);
    return new NextResponse("Failed to fetch gift voucher", { status: 500 });
  }
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const preferredCurrency = normalizeCurrency(body?.currency);

  try {
    const existing = await prisma.giftVoucher.findUnique({
      where: { userId: currentUser.id },
    });

    if (existing) {
      const needsCurrencyUpdate =
        preferredCurrency && existing.currency !== preferredCurrency;

      const updated = needsCurrencyUpdate
        ? await prisma.giftVoucher.update({
            where: { userId: currentUser.id },
            data: { currency: preferredCurrency },
          })
        : existing;

      return NextResponse.json(updated);
    }

    const created = await prisma.giftVoucher.create({
      data: {
        userId: currentUser.id,
        name: "Vin Voucher",
        balance: 0,
        currency: preferredCurrency ?? BASE_CURRENCY,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating gift voucher:", error);
    return new NextResponse("Failed to create gift voucher", { status: 500 });
  }
}