# @vijayishere/photo-hash

Detect near-duplicate photos using a perceptual difference hash (dHash). Two images of the same content - even resized, recompressed, or lightly edited - hash to nearly the same value, while unrelated images hash very differently.

Useful for deduplicating photo libraries, catching re-uploaded images, or flagging near-identical submissions.

## Install

```bash
npm install @vijayishere/photo-hash
```

Requires Node.js >= 18. Uses [`sharp`](https://sharp.pixelplumbing.com/) internally.

## Usage

```js
import { getImageHash, compareImages, isDuplicate, similarity } from '@vijayishere/photo-hash';

// Hash once, store the hash, compare later without re-processing the image.
const hash = await getImageHash('photo.jpg'); // e.g. '1eba8b0b0b1f1e32'

// Compare two images directly.
const result = await compareImages('photo.jpg', 'photo-resized.jpg');
// { hashA: '...', hashB: '...', hammingDistance: 5, similarity: 0.92 }

// Or just ask the yes/no question.
if (await isDuplicate('photo.jpg', 'photo-resized.jpg')) {
  console.log('Likely the same photo.');
}

// Compare precomputed hashes without touching the image files again.
similarity(hashA, hashB); // 0-1, 1 = identical
```

All image-accepting functions take a file path (`string`), an `http(s)` URL (`string`), or image bytes (`Buffer` / `Uint8Array`).

## API

### `getImageHash(input, options?)`

Returns `Promise<string>` - a hex-encoded dHash. Default is a 64-bit hash (16 hex characters); pass `{ hashSize: 16 }` for a more discriminating 256-bit hash.

### `compareImages(inputA, inputB, options?)`

Returns `Promise<{ hashA, hashB, hammingDistance, similarity }>`.

### `isDuplicate(inputA, inputB, threshold?, options?)`

Returns `Promise<boolean>` - `true` when similarity is at or above `threshold` (default `0.9`).

### `similarity(hashA, hashB)` / `hammingDistance(hashA, hashB)`

Compare two already-computed hashes directly - no image processing, useful when you've stored hashes for a large library and want to compare against a new upload without re-hashing everything.

## Calibrated against real photos

Tested against real camera photos, not just synthetic fixtures:

| Comparison | Similarity |
|---|---|
| Identical image | 1.00 |
| Same photo, heavily recompressed (JPEG quality 15) | 0.97 |
| Same photo, resized + recompressed | 0.92 |
| Same photo, cropped | 0.53 |
| Same photo, horizontally flipped | 0.64 |
| Same photo, rotated 90° | 0.48 |
| Two unrelated photos | 0.45 - 0.56 |

This is why the default threshold is `0.9`: it comfortably catches resized/recompressed duplicates while staying well clear of unrelated photos, which typically land in the 0.45-0.56 range purely by chance (a 64-bit hash has no signal left once the underlying content differs).

## Known limitation

**dHash is not robust to rotation, mirroring, or heavy cropping.** A photo rotated 90° or flipped horizontally hashes almost as differently as a completely unrelated photo, because the hash encodes horizontal brightness gradients that rotation and mirroring scramble. If your use case needs to catch rotated or cropped duplicates, you'd need to also hash rotated/flipped variants of each candidate and compare against all of them - this library doesn't do that for you.

## License

MIT
