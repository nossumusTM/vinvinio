import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(length = 32) {
  const bytes = crypto.randomBytes(length);
  let secret = '';

  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }

  return secret;
}

function base32ToBuffer(secret: string): Uint8Array {
  const cleaned = secret.replace(/=+$/u, '').toUpperCase();
  let bits = '';

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Uint8Array.from(bytes);
}

function hotp(secret: string, counter: number) {
  // 8 byte per il contatore (big-endian)
  const buffer = new Uint8Array(8);
  const view = new DataView(buffer.buffer);
  view.setBigUint64(0, BigInt(counter));

  const key = base32ToBuffer(secret);

  const hmac = crypto
    .createHmac('sha1', key)   // key: Uint8Array → BinaryLike OK
    .update(buffer)            // data: Uint8Array → BinaryLike OK
    .digest();                 // Buffer in uscita, nessun problema

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, '0');
}

export function verifyTotp(
  token: string,
  secret: string,
  { window = 1, step = 30 }: { window?: number; step?: number } = {},
) {
  const sanitized = token.replace(/\s+/gu, '');
  if (!sanitized || !secret) return false;

  const counter = Math.floor(Date.now() / 1000 / step);

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const match = hotp(secret, counter + errorWindow) === sanitized;
    if (match) return true;
  }

  return false;
}

export function createTotpSecret() {
  const secret = generateBase32Secret();
  return { secret };
}

export function buildOtpAuthURL({ secret, label, issuer }: { secret: string; label: string; issuer: string }) {
  const encodedLabel = encodeURIComponent(label);
  const encodedIssuer = encodeURIComponent(issuer);

  return `otpauth://totp/${encodedIssuer}:${encodedLabel}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}