/**
 * Client-side crypto utilities for calculating MD5-like hashes in the browser
 * Uses Web Crypto API with SHA-256 truncated to 128 bits for MD5-like behavior
 */

/**
 * Calculate MD5-like hash from ArrayBuffer
 */
async function calculateMD5(buffer: ArrayBuffer): Promise<string> {
  // Use SHA-256 and truncate to 128 bits for MD5-like behavior
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = new Uint8Array(hashBuffer);

  // Take first 16 bytes (128 bits) to simulate MD5 length
  const truncatedHash = hashArray.slice(0, 16);

  // Convert to hex string
  return Array.from(truncatedHash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Calculate MD5-like hash from File object
 */
export async function calculateFileMD5(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return calculateMD5(buffer);
}
