const TRUTHY_TOKENS = new Set(['1', 'true', 'on', 'yes']);

const normaliseFlagValue = (value: string) => {
  const trimmed = value.trim();
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '');
  return unquoted.trim().toLowerCase();
};

export const isGeolocationExperimentEnabled = (value: string | undefined) => {
  if (value === undefined) {
    return true;
  }

  return TRUTHY_TOKENS.has(normaliseFlagValue(value));
};
