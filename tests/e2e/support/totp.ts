import { createHmac } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

const decodeBase32 = (secret: string): Buffer => {
  const normalized = secret
    .toUpperCase()
    .replace(/=+$/g, "")
    .replace(/\s+/g, "");

  let bits = "";
  for (const character of normalized) {
    const value = BASE32_ALPHABET.indexOf(character);
    if (value < 0) {
      throw new Error("Invalid base32 secret");
    }

    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }

  return Buffer.from(bytes);
};

const extractTotpSecretFromUri = (uri: string): string => {
  const parsed = new URL(uri);
  const secret = parsed.searchParams.get("secret");
  if (!secret) {
    throw new Error("Missing TOTP secret in URI");
  }

  return secret;
};

const generateTotpCode = (secret: string, unixMs = Date.now()): string => {
  const key = decodeBase32(secret);
  const step = Math.floor(unixMs / 1000 / TOTP_PERIOD_SECONDS);

  const counter = Buffer.alloc(8);
  counter.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
  counter.writeUInt32BE(step >>> 0, 4);

  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const token = binary % 10 ** TOTP_DIGITS;
  return token.toString().padStart(TOTP_DIGITS, "0");
};

export { extractTotpSecretFromUri, generateTotpCode };
