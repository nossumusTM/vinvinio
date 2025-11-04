// // /api/reviews/get-by-listing/route.ts
// import { NextResponse } from 'next/server';
// export const dynamic = 'force-dynamic';
// import prisma from '@/app/libs/prismadb';

// export async function POST(req: Request) {
//   try {
//     const { listingId } = await req.json();

//     if (!listingId) return NextResponse.json([]);

//     const reviews = await prisma.review.findMany({
//       where: { listingId, },
//       include: {
//         user: {
//           select: { name: true },
//         },
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     const formatted = reviews.map((r: any) => ({
//       rating: r.rating,
//       comment: r.comment,
//       userName: r.user?.name || 'Anonymous',
//       createdAt: r.createdAt || ''
//     }));

//     return NextResponse.json(formatted);
//   } catch (error) {
//     console.error('[GET_LISTING_REVIEWS]', error);
//     return NextResponse.json([]);
//   }
// }

// /api/reviews/get-by-listing/route.ts
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import prisma from '@/app/(marketplace)/libs/prismadb';

export async function POST(req: Request) {
  try {
    const { listingId } = await req.json();
    if (!listingId) return NextResponse.json([]);

    // Step 1: Fetch reviews only
    const reviews = await prisma.review.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });

    // Step 2: Fetch related users safely
    const userIds = [...new Set(reviews.map((r) => r.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

    // Step 3: Format response with safe fallback
    const formatted = reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      userName: userMap[r.userId] || 'Anonymous',
      createdAt: r.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[GET_LISTING_REVIEWS]', error);
    return NextResponse.json([]);
  }
}
