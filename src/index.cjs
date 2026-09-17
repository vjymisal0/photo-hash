'use strict';
let modulePromise;
const load = () => (modulePromise ??= import('./index.js'));

function hammingDistance(hashA, hashB) {
  if (hashA.length !== hashB.length) throw new Error('Hashes must be the same length to compare');
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    let xor = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16);
    while (xor) { distance += xor & 1; xor >>= 1; }
  }
  return distance;
}
function similarity(hashA, hashB) { return 1 - hammingDistance(hashA, hashB) / (hashA.length * 4); }
exports.hammingDistance = hammingDistance;
exports.similarity = similarity;
exports.getImageHash = (...args) => load().then((module) => module.getImageHash(...args));
exports.compareImages = (...args) => load().then((module) => module.compareImages(...args));
exports.isDuplicate = (...args) => load().then((module) => module.isDuplicate(...args));
