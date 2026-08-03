import sharp from 'sharp';

/**
 * Computes a difference hash (dHash) for an image: shrinks it to a tiny
 * grayscale grid and encodes whether each pixel is brighter than its
 * right-hand neighbor as a bit. Robust to resizing, recompression, and
 * minor color/brightness shifts - not to cropping or rotation.
 * @param {Buffer} imageBuffer
 * @param {number} hashSize - Grid is (hashSize+1) x hashSize; hash has hashSize^2 bits. Default 8 (64 bits).
 * @returns {Promise<string>} Hex-encoded hash.
 */
export async function computeDHash(imageBuffer, hashSize = 8) {
  const width = hashSize + 1;
  const height = hashSize;

  const { data } = await sharp(imageBuffer)
    .greyscale()
    .resize(width, height, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < hashSize; x++) {
      const left = data[y * width + x];
      const right = data[y * width + x + 1];
      bits += left > right ? '1' : '0';
    }
  }

  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4).padEnd(4, '0'), 2).toString(16);
  }
  return hex;
}

/**
 * Counts the number of differing bits between two same-length hex hashes.
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number}
 */
export function hammingDistance(hashA, hashB) {
  if (hashA.length !== hashB.length) {
    throw new Error('Hashes must be the same length to compare');
  }

  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    let xor = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16);
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Converts a hamming distance between two hashes into a 0-1 similarity
 * score, where 1 means identical hashes.
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number}
 */
export function similarity(hashA, hashB) {
  const distance = hammingDistance(hashA, hashB);
  const totalBits = hashA.length * 4;
  return 1 - distance / totalBits;
}
