import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import getListings from "@/app/actions/getListings";
import { IListingsParams } from "@/app/actions/getListings";
import nodemailer from "nodemailer";
import { makeUniqueSlug } from "@/app/libs/slugify";
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

    const normalizedCategory = categoryArray
      .map((value: any) =>
        typeof value === 'string'
          ? value
          : value?.value ?? value?.label ?? ''
      )
      .filter((value: string) => typeof value === 'string' && value.trim().length > 0);

    const primaryCategory = normalizedCategory[0] ?? null;

    const slug = await makeUniqueSlug(title, async (candidate) => {
      const count = await prisma.listing.count({
        where: { slug: candidate } as any,
      });
      return count > 0;
    });

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        hostDescription: hostDescription || null,
        imageSrc,
        category: normalizedCategory,
        primaryCategory,
        slug,
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
        status: 'pending',
        user: {
          connect: {
            id: currentUser.id,
          },
        },
      },
      include: {
        user: true, // ✅ this must be outside `data`
      },
    });

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass) {
      try {
        // ✅ Send email notification to the listing creator
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: `"Vuola" <${emailUser}>`,
          to: listing.user.email || 'admin@vuoiaggio.it',
          subject: 'Your Experience Listing is Under Review',
          html: `
            <div style="font-family: 'Nunito', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
              <div style="padding: 24px;">
                <img src="https://vuola.eu/images/vuoiaggiologo.png" alt="Vuola Logo" style="width: 140px; margin: 0 auto 16px; display: block;" />
                <p style="font-size: 16px; margin-bottom: 8px;">Hi ${listing.user.name || 'host'},</p>
                <p style="font-size: 14px; color: #555; margin-bottom: 16px;">
                  Your experience titled <strong>${listing.title}</strong> has been submitted successfully and is currently under review by our moderation team.
                </p>
                <p style="font-size: 14px; color: #555;">We will notify you once it's approved and publicly listed.</p>
                <p style="margin-top: 32px;">Thank you for using <strong>Vuola</strong>! ✨</p>
                <p style="font-size: 12px; color: #aaa; margin-top: 24px;">Vuola Network Srls</p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send listing creation email', emailError);
      }
    } else {
      console.warn('Email credentials are not configured; skipping listing notification email.');
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries()) as unknown as IListingsParams;

  const formattedParams: IListingsParams = {
    ...params,
    roomCount: params.roomCount ? Number(params.roomCount) : undefined,
    guestCount: params.guestCount ? Number(params.guestCount) : undefined,
    bathroomCount: params.bathroomCount ? Number(params.bathroomCount) : undefined,
    skip: params.skip ? Number(params.skip) : undefined,
    take: params.take ? Number(params.take) : undefined,
    category: Array.isArray(params.category) ? params.category[0] : params.category,
  };

  try {
    const listings = await getListings(formattedParams);
    return NextResponse.json(listings);
  } catch (error) {
    console.error("GET /api/listings error:", error);
    return new NextResponse("Failed to fetch listings", { status: 500 });
  }
}
