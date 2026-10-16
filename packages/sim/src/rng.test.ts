import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

function sequence(seed: number | string, n = 20): number[] {
  const rng = createRng(seed);
  return Array.from({ length: n }, () => rng.next());
}

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(sequence('abc')).toEqual(sequence('abc'));
    expect(sequence(42)).toEqual(sequence(42));
  });

  it('gives different sequences for different seeds', () => {
    expect(sequence('abc')).not.toEqual(sequence('abd'));
  });

  it('stays within [0, 1)', () => {
    const rng = createRng('range');
    for (let i = 0; i < 10_000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is roughly uniform', () => {
    const rng = createRng('uniform');
    let sum = 0;
    const n = 100_000;
    for (let i = 0; i < n; i++) sum += rng.next();
    expect(sum / n).toBeGreaterThan(0.49);
    expect(sum / n).toBeLessThan(0.51);
  });

  it('int is inclusive on both ends and covers every value', () => {
    const rng = createRng('int');
    const seen = new Set<number>();
    for (let i = 0; i < 2_000; i++) seen.add(rng.int(3, 7));
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });

  it('int rejects bad ranges', () => {
    const rng = createRng('bad');
    expect(() => rng.int(5, 1)).toThrow(RangeError);
    expect(() => rng.int(1.5, 3)).toThrow(RangeError);
  });

  it('chance handles 0 and 1', () => {
    const rng = createRng('chance');
    for (let i = 0; i < 1_000; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('pick returns members and rejects an empty list', () => {
    const rng = createRng('pick');
    const items = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 100; i++) expect(items).toContain(rng.pick(items));
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it('fork is independent of how much the parent was used', () => {
    const fresh = createRng('parent');
    const used = createRng('parent');
    for (let i = 0; i < 500; i++) used.next();
    const a = fresh.fork('team-1');
    const b = used.fork('team-1');
    expect(Array.from({ length: 10 }, () => a.next())).toEqual(Array.from({ length: 10 }, () => b.next()));
  });

  it('different fork labels give different streams', () => {
    const rng = createRng('parent');
    expect(rng.fork('a').next()).not.toEqual(rng.fork('b').next());
  });
});
