import { createHash, randomBytes } from "node:crypto";

/**
 * Hisstory license key generator.
 *
 * Matches the SHA-512 keyed-hash algorithm from hisstory/tools/keygen.py.
 * Key format: XXXX-XXXX-XXXX-XXXX (12-char payload + 4-char checksum).
 *
 * When a `seed` is provided, the payload is deterministic — the same seed
 * always produces the same key. This lets the webhook and the success page
 * endpoint independently compute the same key for a given Stripe session.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateLicenseKey(secretHex: string, seed?: string): string {
  const secretBytes = Buffer.from(secretHex, "hex");

  let payload = "";
  if (seed) {
    // Deterministic: derive payload from SHA-512(secret + "payload:" + seed)
    const seedHash = createHash("sha512")
      .update(
        Buffer.concat([
          secretBytes,
          Buffer.from("payload:" + seed, "utf-8"),
        ])
      )
      .digest();
    for (let i = 0; i < 12; i++) {
      payload += ALPHABET[seedHash[i] % ALPHABET.length];
    }
  } else {
    // Random (fallback when no seed)
    const randBytes = randomBytes(12);
    for (let i = 0; i < 12; i++) {
      payload += ALPHABET[randBytes[i] % ALPHABET.length];
    }
  }

  // Checksum: SHA-512(secret + payload), map first 4 bytes to ALPHABET
  const hash = createHash("sha512")
    .update(Buffer.concat([secretBytes, Buffer.from(payload, "utf-8")]))
    .digest();

  let checksum = "";
  for (let i = 0; i < 4; i++) {
    checksum += ALPHABET[hash[i] % ALPHABET.length];
  }

  const full = payload + checksum;
  return `${full.slice(0, 4)}-${full.slice(4, 8)}-${full.slice(8, 12)}-${full.slice(12, 16)}`;
}
