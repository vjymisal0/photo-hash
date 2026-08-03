import { readFile } from 'node:fs/promises';

const URL_PATTERN = /^https?:\/\//i;

/**
 * Resolves a path, URL, or Buffer/Uint8Array input into an image Buffer.
 * @param {string | Buffer | Uint8Array} input
 * @returns {Promise<Buffer>}
 */
export async function loadImageBuffer(input) {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof Uint8Array) {
    return Buffer.from(input);
  }

  if (typeof input === 'string') {
    if (URL_PATTERN.test(input)) {
      const response = await fetch(input);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    }
    return readFile(input);
  }

  throw new TypeError('Image input must be a file path, an http(s) URL, or a Buffer/Uint8Array');
}
