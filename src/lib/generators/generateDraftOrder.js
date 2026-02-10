// src/lib/generators/generateDraftOrder.js

function mulberry32(seed) {
  // deterministic PRNG for reproducible shuffles if you want them
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(str) {
  // simple string hash -> uint32
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateDraftOrder(memberIds, { seedString } = {}) {
  const ids = [...memberIds];
  const rand = seedString ? mulberry32(hashStringToSeed(seedString)) : Math.random;

  // Fisher-Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor((typeof rand === "function" ? rand() : rand) * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  // return [{member_id, draft_position}]
  return ids.map((member_id, idx) => ({
    member_id,
    draft_position: idx + 1,
  }));
}
