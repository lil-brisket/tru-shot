import { describe, expect, it } from 'vitest';
import { matchRoute } from './router';

describe('matchRoute', () => {
  it('matches home', () => {
    expect(matchRoute('/')).toBe('home');
    expect(matchRoute('')).toBe('home');
  });
  it('matches the dev gallery, with or without a trailing slash', () => {
    expect(matchRoute('/dev')).toBe('dev');
    expect(matchRoute('/dev/')).toBe('dev');
  });
  it('treats everything else as not found', () => {
    expect(matchRoute('/nope')).toBe('not-found');
    expect(matchRoute('/dev/extra')).toBe('not-found');
  });
});
