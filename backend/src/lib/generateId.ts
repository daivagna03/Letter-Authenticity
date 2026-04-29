import { randomBytes } from 'crypto';

/**
 * Generates a 24-character, timestamp-based unique ID.
 *
 * Structure (24 hex chars = 96 bits):
 *   [12 chars] Unix timestamp in milliseconds (hex) — enables time-ordering
 *   [12 chars] Cryptographically random bytes (hex)  — ensures uniqueness
 *
 * Example: "01965f3b8d2c4a7e9f1b3d5e"
 */
export function generateId(): string {
  const timestamp = Date.now().toString(16).padStart(12, '0'); // 12 hex chars
  const random = randomBytes(6).toString('hex');               // 12 hex chars
  return timestamp + random;                                    // 24 chars total
}
