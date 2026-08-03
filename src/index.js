import { loadImageBuffer } from './loadImage.js';
import { computeDHash, hammingDistance, similarity as similarityOf } from './dhash.js';

export { hammingDistance };

/**
 * Computes a difference hash (dHash) for an image as a hex string.
 * Same-content images (resized, recompressed, minor edits) produce hashes
 * with a small hamming distance; unrelated images produce large distances.
 * @param {string | Buffer | Uint8Array} input - File path, http(s) URL, or image bytes.
 * @param {{ hashSize?: number }} [options] - Grid size; hash has hashSize^2 bits. Default 8 (64 bits).
 * @returns {Promise<string>}
 */
export async function getImageHash(input, options = {}) {
  const buffer = await loadImageBuffer(input);
  return computeDHash(buffer, options.hashSize ?? 8);
}

/**
 * Converts two hashes into a 0-1 similarity score (1 = identical).
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number}
 */
export function similarity(hashA, hashB) {
  return similarityOf(hashA, hashB);
}

/**
 * Hashes and compares two images directly.
 * @param {string | Buffer | Uint8Array} inputA
 * @param {string | Buffer | Uint8Array} inputB
 * @param {{ hashSize?: number }} [options]
 * @returns {Promise<{ hashA: string, hashB: string, hammingDistance: number, similarity: number }>}
 */
export async function compareImages(inputA, inputB, options = {}) {
  const [hashA, hashB] = await Promise.all([getImageHash(inputA, options), getImageHash(inputB, options)]);
  return {
    hashA,
    hashB,
    hammingDistance: hammingDistance(hashA, hashB),
    similarity: similarityOf(hashA, hashB),
  };
}

/**
 * Determines whether two images are likely the same photo (allowing for
 * resizing, recompression, or minor edits). Not robust to rotation,
 * mirroring, or heavy cropping - see the README.
 * @param {string | Buffer | Uint8Array} inputA
 * @param {string | Buffer | Uint8Array} inputB
 * @param {number} [threshold=0.9] - Minimum similarity (0-1) to count as a duplicate.
 * @param {{ hashSize?: number }} [options]
 * @returns {Promise<boolean>}
 */
export async function isDuplicate(inputA, inputB, threshold = 0.9, options = {}) {
  const result = await compareImages(inputA, inputB, options);
  return result.similarity >= threshold;
}
