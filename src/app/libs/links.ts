// app/libs/links.ts
export const slugSegment = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

type ListingLike = {
  id?: string | null;
  slug?: string | null;
  category?: string[] | null;
  primaryCategory?: string | null;
  title?: string | null;
};

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

const looksLikeObjectId = (value: string | null | undefined, id?: string | null) => {
  if (value == null || value.trim().length === 0) {
    return false;
  }

  if (OBJECT_ID_RE.test(value) === false) {
    return false;
  }

  if (id == null || id.trim().length === 0) {
    return true;
  }

  try {
    return value.toLowerCase() === id.toLowerCase();
  } catch {
    return true;
  }
};

function primaryCategoryFrom(listing: ListingLike) {
  if (listing.primaryCategory && listing.primaryCategory.trim().length > 0) {
    return listing.primaryCategory;
  }

  if (Array.isArray(listing.category) && listing.category.length > 0) {
    return listing.category[0];
  }

  return "general";
}

export function canonicalSegmentsForListing(listing: ListingLike) {
  const rawCategory = primaryCategoryFrom(listing);
  const categorySegment = slugSegment(String(rawCategory || "general")) || "general";

  let slugCandidate =
    typeof listing.slug === "string" && listing.slug.trim().length > 0
      ? listing.slug.trim()
      : undefined;

  if (looksLikeObjectId(slugCandidate, listing.id)) {
    slugCandidate = undefined;
  }

  if (slugCandidate == null && typeof listing.title === "string") {
    const fallbackFromTitle = slugSegment(listing.title);
    if (fallbackFromTitle.length > 0) {
      slugCandidate = fallbackFromTitle;
    }
  }

  if (slugCandidate == null && typeof listing.id === "string" && listing.id.trim().length > 0) {
    slugCandidate = listing.id.trim();
  }

  return { categorySegment, slug: slugCandidate };
}

export function hrefForListing(listing: ListingLike) {
  const { categorySegment, slug } = canonicalSegmentsForListing(listing);

  const resolvedSlug = slug && slug.length > 0 ? slug : "listing";

  return `/tours/${categorySegment}/${encodeURIComponent(resolvedSlug)}`;
}
