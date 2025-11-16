export const normalizeDialCode = (dialCode?: string | null) => {
  if (!dialCode) return null;
  const trimmed = dialCode.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('+')) {
    const sanitized = `+${trimmed.replace(/[^\d]/g, '')}`;
    return sanitized.length > 1 ? sanitized : null;
  }
  const numeric = trimmed.replace(/[^\d]/g, '');
  return numeric ? `+${numeric}` : null;
};

export const formatPhoneNumberToE164 = (
  rawInput: string,
  dialCode?: string | null,
) => {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const sanitized = `+${trimmed.replace(/[^\d]/g, '')}`;
    return sanitized.length > 1 ? sanitized : null;
  }

  const normalizedDial = normalizeDialCode(dialCode);
  if (!normalizedDial) {
    return null;
  }

  const digitsOnly = trimmed.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;

  const nationalNumber = digitsOnly.replace(/^0+/, '');
  return `${normalizedDial}${nationalNumber}`;
};

export const maskPhoneNumber = (phone?: string | null) => {
  if (!phone) return '';
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length <= 4) {
    return phone;
  }

  const visible = digits.slice(-4);
  const masked = digits
    .slice(0, -4)
    .replace(/\d/g, '*');
  return `${phone.startsWith('+') ? '+' : ''}${masked}${visible}`;
};