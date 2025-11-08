export type ProfiledUser = {
  username?: string | null;
  hostName?: string | null;
  name?: string | null;
  role?: string | null;
};

const normaliseHandle = (value?: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // Allow only URL-friendly handle characters so display names like
  // "LVN MMDV" or "John Doe" are ignored.
  const handlePattern = /^[a-zA-Z0-9._-]+$/;
  if (!handlePattern.test(trimmed)) {
    return null;
  }

  return trimmed;
};

export const profilePathForUser = (
  user: ProfiledUser | null | undefined,
  fallbackHandle?: string | null | undefined,
  roleHint?: string | null,
): string | null => {
  const primaryHandle = normaliseHandle(user?.username);
  const fallback = normaliseHandle(fallbackHandle);
  const handle = primaryHandle ?? fallback;

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
