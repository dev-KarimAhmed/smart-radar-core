/**
 * Validates that a binary buffer is a genuine PDF document
 * (starts with `%PDF-` magic header and contains `%%EOF` trailer).
 */
export function isValidPdfBuffer(buf: Buffer | Uint8Array | null | undefined): boolean {
  if (!buf || buf.length < 256) return false;

  // Check "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
  if (
    buf[0] !== 0x25 ||
    buf[1] !== 0x50 ||
    buf[2] !== 0x44 ||
    buf[3] !== 0x46 ||
    buf[4] !== 0x2d
  ) {
    return false;
  }

  // Check trailer contains "%%EOF" within the last 1024 bytes
  const tailStart = Math.max(0, buf.length - 1024);
  const tailText = Buffer.from(buf.subarray(tailStart)).toString('latin1');
  return tailText.includes('%%EOF');
}
