export interface HashOptions {
  /** Grid size; hash has hashSize^2 bits. Default 8 (64-bit hash). */
  hashSize?: number;
}

export interface CompareResult {
  hashA: string;
  hashB: string;
  hammingDistance: number;
  similarity: number;
}

/**
 * Computes a difference hash (dHash) for an image as a hex string.
 */
export function getImageHash(input: string | Buffer | Uint8Array, options?: HashOptions): Promise<string>;

/**
 * Counts differing bits between two hashes of equal length.
 */
export function hammingDistance(hashA: string, hashB: string): number;

/**
 * Converts two hashes into a 0-1 similarity score (1 = identical).
 */
export function similarity(hashA: string, hashB: string): number;

/**
 * Hashes and compares two images directly.
 */
export function compareImages(
  inputA: string | Buffer | Uint8Array,
  inputB: string | Buffer | Uint8Array,
  options?: HashOptions
): Promise<CompareResult>;

/**
 * Determines whether two images are likely the same photo (allowing for
 * resizing, recompression, or minor edits). Not robust to rotation,
 * mirroring, or heavy cropping.
 */
export function isDuplicate(
  inputA: string | Buffer | Uint8Array,
  inputB: string | Buffer | Uint8Array,
  threshold?: number,
  options?: HashOptions
): Promise<boolean>;
