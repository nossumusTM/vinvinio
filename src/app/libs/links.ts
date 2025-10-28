// app/libs/links.ts
type ListingLike = {
  id?: string;
  slug?: string | null;
  category?: string[] | null;
};

export function hrefForListing(listing: ListingLike) {
  const slug = listing.slug ?? undefined;
  const category =
    (Array.isArray(listing.category) && listing.category.length > 0
      ? listing.category[0]
      : "general");

  if (slug) return `/tours/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`;
  if (listing.id) return `/listings/${encodeURIComponent(listing.id)}`; // fallback for old data
  return "/";
}