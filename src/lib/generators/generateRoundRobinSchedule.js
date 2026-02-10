// src/lib/generators/generateRoundRobinSchedule.js

function rotate(arr) {
  // Circle method rotation: keep first fixed, rotate the rest
  if (arr.length <= 2) return arr;
  const [first, ...rest] = arr;
  const last = rest.pop();
  return [first, last, ...rest];
}

function pairingsFromCircle(list) {
  const pairs = [];
  const n = list.length;
  for (let i = 0; i < n / 2; i++) {
    pairs.push([list[i], list[n - 1 - i]]);
  }
  return pairs;
}

function buildPartnerMap(memberIds, weekIndex) {
  // Partner rotation: shift by weekIndex+1, pair i with i+1 in rotated list (wrap)
  const n = memberIds.length;
  const shift = (weekIndex + 1) % n;
  const rotated = memberIds.map((_, i) => memberIds[(i + shift) % n]);

  const partnerOf = new Map();
  for (let i = 0; i < n; i++) {
    const a = rotated[i];
    const b = rotated[(i + 1) % n];
    if (a !== b) partnerOf.set(a, b);
  }
  return partnerOf;
}

export function generateRoundRobinSchedule(memberIds, weeksRequested) {
  // Uses standard round robin weeks = n-1 (even) or n (odd with BYE).
  // If user picks fewer weeks, we take the first N weeks from the full round robin.
  // If user picks more weeks, we wrap/repeat the base pattern (still editable later).

  const ids = [...memberIds];

  // If odd, add BYE placeholder
  const BYE = "__BYE__";
  const isOdd = ids.length % 2 === 1;
  const circle = isOdd ? [...ids, BYE] : [...ids];

  const baseWeeks = circle.length - 1;
  const totalWeeks = Math.max(1, weeksRequested);

  const rows = [];
  let cur = [...circle];

  for (let w = 0; w < totalWeeks; w++) {
    const weekNumber = w + 1;

    // Determine which base-week pattern we're using
    const baseIndex = w % baseWeeks;

    // For each new cycle, reset and rotate baseIndex times
    if (baseIndex === 0) {
      cur = [...circle];
    } else {
      // rotate baseIndex times from fresh circle
      cur = [...circle];
      for (let r = 0; r < baseIndex; r++) cur = rotate(cur);
    }

    const pairs = pairingsFromCircle(cur);

    // Partner map computed on the real member IDs only (no BYE)
    const partnerOf = buildPartnerMap(ids, w);

    for (const [a, b] of pairs) {
      if (a === BYE || b === BYE) {
        const solo = a === BYE ? b : a;
        rows.push({
          week: weekNumber,
          member_a_id: solo,
          member_b_id: null,
          partner_a_id: partnerOf.get(solo) || null,
          partner_b_id: null,
          is_bye: true,
        });
      } else {
        // Avoid setting partner to opponent if possible
        let partnerA = partnerOf.get(a) || null;
        let partnerB = partnerOf.get(b) || null;
        if (partnerA === b) partnerA = null;
        if (partnerB === a) partnerB = null;

        rows.push({
          week: weekNumber,
          member_a_id: a,
          member_b_id: b,
          partner_a_id: partnerA,
          partner_b_id: partnerB,
          is_bye: false,
        });
      }
    }
  }

  return rows;
}
