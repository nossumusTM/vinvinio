const toASCII = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^\w\s-]/g, '')        // remove non-word
    .trim()
    .replace(/[\s_-]+/g, '-')        // collapse spaces/underscores
    .replace(/^-+|-+$/g, '')         // trim dashes
    .toLowerCase();

export async function makeUniqueSlug(
  baseTitle: string,
  exists: (slug: string) => Promise<boolean>
) {
  const base = toASCII(baseTitle) || 'listing';
  const fallback = () => {
    const rnd = Math.random().toString(36).slice(2, 7);
    return `${base}-${rnd}`;
  };

  try {
    if (!(await exists(base))) return base;

    for (let i = 2; i <= 200; i++) {
      const candidate = `${base}-${i}`;
      if (!(await exists(candidate))) return candidate;
    }
  } catch (error) {
    console.error('makeUniqueSlug: failed to verify slug uniqueness', error);
    return fallback();
  }

  return fallback();
}
