import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { getImageHash, hammingDistance, similarity, compareImages, isDuplicate } from '../src/index.js';

const SIZE = 128;

async function makeGradientPng() {
  const raw = Buffer.alloc(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      raw[y * SIZE + x] = Math.floor(((x + y) / (SIZE * 2)) * 255);
    }
  }
  return sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png().toBuffer();
}

async function makeCheckerboardPng() {
  const raw = Buffer.alloc(SIZE * SIZE);
  const squares = 8;
  const squareSize = SIZE / squares;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cx = Math.floor(x / squareSize);
      const cy = Math.floor(y / squareSize);
      raw[y * SIZE + x] = (cx + cy) % 2 === 0 ? 255 : 0;
    }
  }
  return sharp(raw, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png().toBuffer();
}

test('identical images produce identical hashes', async () => {
  const buffer = await makeGradientPng();
  const hashA = await getImageHash(buffer);
  const hashB = await getImageHash(buffer);
  assert.equal(hashA, hashB);
  assert.equal(similarity(hashA, hashB), 1);
});

test('default hash is 16 hex chars (64 bits)', async () => {
  const hash = await getImageHash(await makeGradientPng());
  assert.equal(hash.length, 16);
});

test('hashSize option changes hash length', async () => {
  const hash = await getImageHash(await makeGradientPng(), { hashSize: 16 });
  assert.equal(hash.length, 64); // 16^2 bits / 4 bits-per-hex-char
});

test('resizing and recompressing the same image keeps high similarity', async () => {
  const original = await makeGradientPng();
  const recompressed = await sharp(original).resize(64).jpeg({ quality: 50 }).toBuffer();

  const result = await compareImages(original, recompressed);
  assert.ok(result.similarity > 0.85, `expected > 0.85, got ${result.similarity}`);
});

test('clearly different images have low similarity', async () => {
  const gradient = await makeGradientPng();
  const checkerboard = await makeCheckerboardPng();

  const result = await compareImages(gradient, checkerboard);
  assert.ok(result.similarity < 0.7, `expected < 0.7, got ${result.similarity}`);
});

test('isDuplicate respects the threshold', async () => {
  const original = await makeGradientPng();
  const recompressed = await sharp(original).resize(64).jpeg({ quality: 50 }).toBuffer();
  const checkerboard = await makeCheckerboardPng();

  assert.equal(await isDuplicate(original, recompressed), true);
  assert.equal(await isDuplicate(original, checkerboard), false);
});

test('hammingDistance throws on mismatched hash lengths', () => {
  assert.throws(() => hammingDistance('ab', 'abcd'));
});

test('accepts a file path', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'photo-hash-'));
  const filePath = join(dir, 'test.png');
  try {
    await writeFile(filePath, await makeGradientPng());
    const hash = await getImageHash(filePath);
    assert.equal(hash.length, 16);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects unsupported input types', async () => {
  await assert.rejects(() => getImageHash(12345), TypeError);
});
