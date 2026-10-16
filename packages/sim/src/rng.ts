// Seeded random number generator. All randomness in the simulation must come from here.

export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  /** True with probability p (0 to 1). */
  chance(p: number): boolean;
  /** One item from a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** An independent generator derived from this seed and a label, unaffected by how much this one has been used. */
  fork(label: string): Rng;
}

function hashString(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number | string): Rng {
  const seedText = String(seed);
  const raw = mulberry32(hashString(seedText)());

  const rng: Rng = {
    next: raw,
    int(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
        throw new RangeError(`int(${min}, ${max}) needs integers with min <= max`);
      }
      return min + Math.floor(raw() * (max - min + 1));
    },
    chance(p) {
      return raw() < p;
    },
    pick(items) {
      if (items.length === 0) throw new RangeError('pick() needs a non-empty list');
      const item = items[Math.floor(raw() * items.length)];
      return item as (typeof items)[number];
    },
    fork(label) {
      return createRng(`${seedText}/${label}`);
    },
  };
  return rng;
}
