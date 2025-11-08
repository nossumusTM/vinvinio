export type ProfiledUser = {
  username?: string | null;
  role?: string | null;
  id?: string | null;
};

export const profilePathForUser = (
  user: ProfiledUser | null | undefined,
  fallbackHandle?: string | null | undefined,
): string | null => {
  if (user == null && fallbackHandle == null) {
    return null;
  }

  const handle = user?.username ?? fallbackHandle ?? user?.id ?? null;
  if (handle == null) {
    return null;
  }

  const encoded = encodeURIComponent(handle);
  return user?.role === 'host'
    ? `/hosts/${encoded}`
    : `/social-card/${encoded}`;
};

export const isHostUser = (user: ProfiledUser | null | undefined): boolean => {
  return user?.role === 'host';
};
