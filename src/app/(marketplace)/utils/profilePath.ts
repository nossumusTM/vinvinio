export type ProfiledUser = {
  username?: string | null;
  hostName?: string | null;
  name?: string | null;
  role?: string | null;
};

const firstNonEmpty = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

export const profilePathForUser = (
  user: ProfiledUser | null | undefined,
  fallbackHandle?: string | null | undefined,
  roleHint?: string | null,
): string | null => {
  const handle = firstNonEmpty(
    user?.username,
    fallbackHandle,
    user?.hostName,
    user?.name,
  );

  if (handle == null) {
    return null;
  }

  const encoded = encodeURIComponent(handle);
  const role = user?.role ?? roleHint;
  return role === 'host' ? `/hosts/${encoded}` : `/social-card/${encoded}`;
};

export const isHostUser = (user: ProfiledUser | null | undefined): boolean => {
  return user?.role === 'host';
};
