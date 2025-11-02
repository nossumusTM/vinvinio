import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import getListings from "@/app/actions/getListings";
import { IListingsParams } from "@/app/actions/getListings";
import nodemailer from "nodemailer";
import { makeUniqueSlug } from "@/app/libs/slugify";
import { PricingType } from "@prisma/client";
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
    groupStyles,
    durationCategory,
    environments,
    activityForms,
    seoKeywords,
    pricingType,
    groupPrice,
    groupSize,
    customPricing,
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
    price === null || price === undefined
  ) {
    return new NextResponse("Missing or invalid required fields", { status: 400 });
  }

  const allowedPricingTypes = new Set<PricingType>(['fixed', 'group', 'custom']);
  const normalizedPricingType: PricingType =
    typeof pricingType === 'string' && allowedPricingTypes.has(pricingType as PricingType)
      ? (pricingType as PricingType)
      : 'fixed';

  const parsedBasePrice = Math.round(Number(price));
  if (!Number.isFinite(parsedBasePrice) || parsedBasePrice <= 0) {
    return new NextResponse('Price must be a positive number', { status: 400 });
  }

  const parsedGroupPrice = groupPrice !== null && groupPrice !== undefined
    ? Math.round(Number(groupPrice))
    : null;
  const parsedGroupSize = groupSize !== null && groupSize !== undefined
    ? Math.round(Number(groupSize))
    : null;

  if (normalizedPricingType === 'group') {
    if (!parsedGroupPrice || parsedGroupPrice <= 0 || !parsedGroupSize || parsedGroupSize <= 0) {
      return new NextResponse('Group pricing requires a price and group size', { status: 400 });
    }
  }

  if (normalizedPricingType === 'custom') {
    if (!Array.isArray(customPricing) || customPricing.length === 0) {
      return new NextResponse('Custom pricing requires at least one tier', { status: 400 });
    }
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

    const normalizeStringArray = (value: unknown): string[] =>
      Array.isArray(value)
        ? value
            .map((item) => (typeof item === 'string' ? item : item?.value ?? item?.label ?? ''))
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item): item is string => item.length > 0)
        : [];

    const normalizedGroupStyles = normalizeStringArray(groupStyles);
    const normalizedEnvironments = normalizeStringArray(environments);
    const normalizedActivityForms = normalizeStringArray(activityForms);
    const normalizedSeoKeywords = normalizeStringArray(seoKeywords);
    const normalizedLanguages = normalizeStringArray(languages);
    const normalizedLocationTypes = normalizeStringArray(locationType);
    const normalizedDurationCategory =
      typeof durationCategory === 'string' && durationCategory.trim().length > 0
        ? durationCategory.trim()
        : null;

    const parsedCustomPricing = Array.isArray(customPricing)
      ? customPricing
          .map((tier: any) => ({
            minGuests: Number(tier?.minGuests ?? 0),
            maxGuests: Number(tier?.maxGuests ?? 0),
            price: Number(tier?.price ?? 0),
          }))
          .filter((tier) => tier.minGuests > 0 && tier.maxGuests > 0 && tier.price > 0)
      : [];

    if (normalizedPricingType === 'custom' && parsedCustomPricing.length === 0) {
      return new NextResponse('Provide at least one valid custom pricing tier', { status: 400 });
    }

    const locationValue =
      typeof location === 'string'
        ? location
        : typeof location === 'object'
          ? location?.value
          : null;

    if (!locationValue) {
      return new NextResponse('Invalid location information', { status: 400 });
    }

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
          typeof experienceHour === 'number'
            ? experienceHour
            : experienceHour && typeof experienceHour === 'object'
              ? parseFloat(experienceHour.value)
              : experienceHour
                ? parseFloat(experienceHour)
                : null,
        meetingPoint: meetingPoint || null,
        languages: normalizedLanguages.length > 0 ? { set: normalizedLanguages } : undefined,
        locationValue,
        price: parsedBasePrice,
        pricingType: normalizedPricingType,
        groupPrice: normalizedPricingType === 'group' ? parsedGroupPrice : null,
        groupSize: normalizedPricingType === 'group' ? parsedGroupSize : null,
        customPricing:
          normalizedPricingType === 'custom' && parsedCustomPricing.length > 0
            ? parsedCustomPricing
            : null,
        locationType: normalizedLocationTypes.length > 0 ? { set: normalizedLocationTypes } : undefined,
        locationDescription,
        groupStyles: { set: normalizedGroupStyles },
        durationCategory: normalizedDurationCategory,
        environments: { set: normalizedEnvironments },
        activityForms: { set: normalizedActivityForms },
        seoKeywords: { set: normalizedSeoKeywords },
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

  const parseArrayParam = (value?: string | string[]) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const parsed = value
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean);
      return parsed.length > 0 ? parsed : undefined;
    }

    const parsed = String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return parsed.length > 0 ? parsed : undefined;
  };

  const formattedParams: IListingsParams = {
    ...params,
    roomCount: params.roomCount ? Number(params.roomCount) : undefined,
    guestCount: params.guestCount ? Number(params.guestCount) : undefined,
    bathroomCount: params.bathroomCount ? Number(params.bathroomCount) : undefined,
    skip: params.skip ? Number(params.skip) : undefined,
    take: params.take ? Number(params.take) : undefined,
    category: Array.isArray(params.category) ? params.category[0] : params.category,
    groupStyles: parseArrayParam(params.groupStyles),
    duration: params.duration ? String(params.duration) : undefined,
    environments: parseArrayParam(params.environments),
    activityForms: parseArrayParam(params.activityForms),
    seoKeywords: parseArrayParam(params.seoKeywords),
    languages: parseArrayParam(params.languages),
  };

  try {
    const listings = await getListings(formattedParams);
    return NextResponse.json(listings);
  } catch (error) {
    console.error("GET /api/listings error:", error);
    return new NextResponse("Failed to fetch listings", { status: 500 });
  }
}
