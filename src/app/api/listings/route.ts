import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  const body = await request.json();
  const {
    title,
    description,
    imageSrc,
    category,
    guestCount,
    location,
    price,
    experienceHour,
    hostDescription,
    meetingPoint,
    languages,
    locationType,
    locationDescription,
  } = body;

  // Basic validation
  if (
    !title ||
    !description ||
    !imageSrc ||
    !Array.isArray(imageSrc) ||
    imageSrc.length === 0 ||
    !category ||
    !guestCount ||
    !location ||
    !price
  ) {
    return new NextResponse("Missing or invalid required fields", { status: 400 });
  }

  try {

    const categoryArray = Array.isArray(category)
    ? category
    : typeof category === 'string'
      ? [category]
      : [];

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        hostDescription: hostDescription || null,
        imageSrc,
        category: categoryArray,
        guestCount,
        roomCount: 0,
        bathroomCount: 0,
        experienceHour:
        experienceHour && typeof experienceHour === 'object'
          ? parseFloat(experienceHour.value)
          : experienceHour
            ? parseFloat(experienceHour)
            : null,
        meetingPoint: meetingPoint || null,
        languages: Array.isArray(languages)
        ? { set: languages.map((lang: any) => lang.value || lang) }
        : undefined,
        locationValue: location.value,
        price: parseInt(price, 10),
        locationType: Array.isArray(locationType)
        ? { set: locationType.map((type: any) => type.value || type) }
        : undefined,
        locationDescription,
        user: {
          connect: {
            id: currentUser.id,
          },
        },
      },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}