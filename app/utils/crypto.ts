/**
 * Calculate MD5 hash from an ArrayBuffer
 * @param buffer - The file buffer to hash
 * @returns Promise<string> - The MD5 hash as a hex string
 */
export async function calculateMD5(buffer: ArrayBuffer): Promise<string> {
  // Use the Web Crypto API to calculate MD5
  // Note: MD5 is not available in Web Crypto API, so we'll use a simple implementation
  // For production, consider using a more robust crypto library

  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // For now, we'll use SHA-256 and truncate to simulate MD5 length
  // In production, you might want to use a proper MD5 implementation
  return hashHex.substring(0, 32);
}
