import { Prisma } from "@prisma/client";
import prisma from "@/app/libs/prismadb";
import { makeUniqueSlug } from "@/app/libs/slugify";

export type ListingWithSlugFields = {
  id: string;
  title: string;
  slug?: string | null;
  primaryCategory?: string | null;
  category?: string[] | null;
};

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

function slugIsLikelyObjectId(slug: string, id: string) {
  if (slug.trim().length === 0) {
    return false;
  }

  if (slug.localeCompare(id, undefined, { sensitivity: "accent" }) === 0) {
    return true;
  }

  return OBJECT_ID_RE.test(slug);
}

export async function ensureListingSlug<T extends ListingWithSlugFields>(listing: T): Promise<T> {
  const updates: Partial<Pick<ListingWithSlugFields, "slug" | "primaryCategory">> = {};

  const existingSlugRaw = typeof listing.slug === "string" ? listing.slug.trim() : "";
  const needsFreshSlug =
    existingSlugRaw.length === 0 || slugIsLikelyObjectId(existingSlugRaw, listing.id);

  if (needsFreshSlug) {
    const slug = await makeUniqueSlug(listing.title, async (candidate) => {
      const where: Prisma.ListingWhereInput = {
        slug: candidate,
        NOT: { id: listing.id },
      };
      const count = await prisma.listing.count({ where });
      return count > 0;
    });
    updates.slug = slug;
  }

  const existingPrimary =
    typeof listing.primaryCategory === "string" ? listing.primaryCategory.trim() : "";

  if (existingPrimary.length === 0) {
    const derivedCategory = Array.isArray(listing.category)
      ? listing.category.find((value) => typeof value === "string" && value.trim().length > 0)
      : undefined;

    if (derivedCategory) {
      updates.primaryCategory = derivedCategory;
    }
  }

  if (Object.keys(updates).length > 0) {
    const refreshed = await prisma.listing.update({
      where: { id: listing.id },
      data: updates,
      select: {
        slug: true,
        primaryCategory: true,
      },
    });

    return {
      ...listing,
      ...updates,
      ...refreshed,
    } as T;
  }

  return {
    ...listing,
    slug: existingSlugRaw || listing.slug || null,
    primaryCategory: existingPrimary || listing.primaryCategory || null,
  } as T;
}
