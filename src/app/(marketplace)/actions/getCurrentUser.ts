export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/app/(marketplace)/libs/prismadb";
import {
  SafeUser,
  SocialCardVisitedPlace,
  SocialCardVisibility,
} from "@/app/(marketplace)/types";

export async function getSession() {
  return await getServerSession(authOptions);
}

export default async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const session = await getSession();
    if (!session?.user?.email) return null;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: {
        id: true,
        name: true,
        email: true,
        hostName: true,
        image: true,
        role: true,
        alternateRole: true,
        referenceId: true,
        favoriteIds: true,
        username: true,
        phone: true,
        contact: true,
        legalName: true,
        address: true,
        bio: true,
        visitedCountries: true,
        visitedCities: true,
        profession: true,
        hobbies: true,
        preferredContacts: true,
        identityVerified: true,
        phoneVerified: true,
        isSuspended: true,
        suspendedAt: true,
        socialCardVisibility: true,
        socialCardIsPublic: true,
        visitedPlaces: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        passwordUpdatedAt: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      emailVerified: user.emailVerified?.toISOString() || null,
      alternateRole: user.alternateRole ?? null,
      phone: user.phone ?? null,
      contact: user.contact ?? null,
      legalName: user.legalName ?? null,
      address: user.address ?? null,
      hostName: user.hostName || null,
      username: user.username ?? null,
      bio: user.bio ?? null,
      visitedCountries: Array.isArray(user.visitedCountries) ? user.visitedCountries : [],
      visitedCities: Array.isArray(user.visitedCities) ? user.visitedCities : [],
      profession: user.profession ?? null,
      hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
      preferredContacts: Array.isArray(user.preferredContacts) ? user.preferredContacts : [],
      identityVerified: typeof user.identityVerified === 'boolean' ? user.identityVerified : false,
      phoneVerified: typeof user.phoneVerified === 'boolean' ? user.phoneVerified : false,
      isSuspended: Boolean(user.isSuspended),
      suspendedAt: user.suspendedAt ?? null,
      socialCardVisibility:
        user.socialCardVisibility && typeof user.socialCardVisibility === 'object'
          ? (user.socialCardVisibility as SocialCardVisibility)
          : null,
      socialCardIsPublic: typeof user.socialCardIsPublic === 'boolean' ? user.socialCardIsPublic : true,
      visitedPlaces: Array.isArray(user.visitedPlaces)
        ? (user.visitedPlaces as SocialCardVisitedPlace[])
        : null,
      passwordUpdatedAt: user.passwordUpdatedAt?.toISOString() || null,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}