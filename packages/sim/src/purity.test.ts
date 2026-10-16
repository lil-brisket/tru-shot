import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Enforces the determinism and isolation rules for the simulation package (GAME_DESIGN.md section 4, CLAUDE.md hard rules).

const srcDir = fileURLToPath(new URL('.', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const banned: Array<[RegExp, string]> = [
  [/Math\.random/, 'Math.random (use the injected Rng)'],
  [/Date\.now/, 'Date.now (use the injected Rng or an explicit parameter)'],
  [/new Date\(/, 'new Date() (use an explicit parameter)'],
  [/performance\.now/, 'performance.now'],
  [/\b(window|document|localStorage|indexedDB)\b/, 'browser globals'],
  [/from\s+['"][^'"]*(packages\/web|@true-shot\/web)/, 'imports from the web package'],
];

describe('sim package purity', () => {
  const files = sourceFiles(srcDir);

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file.slice(srcDir.length)} has no banned APIs`, () => {
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const [pattern, label] of banned) {
        expect(pattern.test(code), `found ${label}`).toBe(false);
      }
    });
  }
});
