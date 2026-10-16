import { describe, expect, it } from 'vitest';
import { buildServiceWorker, precacheList } from './serviceWorker';

const ORIGIN = 'https://true-shot.test';
const FILES = ['/', '/assets/index-abc.js', '/icon.svg'];

type Listener = (event: unknown) => void;
type FakeRequest = { url: string; method: string; mode: string };

// Runs the generated worker source against small stand-ins for the browser's worker globals.
function startWorker(version = 'v1', existingCaches: string[] = []) {
  const listeners: Record<string, Listener> = {};
  const stores = new Map<string, Map<string, string>>(
    existingCaches.map((name) => [name, new Map()]),
  );
  const net = { online: true };
  const pathOf = (req: string | FakeRequest) =>
    typeof req === 'string' ? req : new URL(req.url).pathname;

  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: Listener) => {
      listeners[type] = fn;
    },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  const caches = {
    open: async (name: string) => {
      const store = stores.get(name) ?? new Map<string, string>();
      stores.set(name, store);
      return {
        addAll: async (urls: string[]) => {
          for (const url of urls) store.set(url, `cached ${url}`);
        },
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (req: string | FakeRequest, opts: { cacheName: string }) =>
      stores.get(opts.cacheName)?.get(pathOf(req)),
  };
  const fetch = async (req: FakeRequest) => {
    if (!net.online) throw new TypeError('Failed to fetch');
    return `network ${pathOf(req)}`;
  };

  new Function('self', 'caches', 'fetch', buildServiceWorker(FILES, version))(self, caches, fetch);

  const lifecycle = async (type: 'install' | 'activate') => {
    let done: Promise<unknown> = Promise.resolve();
    listeners[type]?.({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
  };
  const request = async (path: string, mode = 'no-cors', origin = ORIGIN) => {
    let response: Promise<unknown> | undefined;
    const req: FakeRequest = { url: `${origin}${path}`, method: 'GET', mode };
    listeners.fetch?.({ request: req, respondWith: (p: Promise<unknown>) => (response = p) });
    return response;
  };
  return { stores, net, lifecycle, request };
}

describe('precacheList', () => {
  it('lists the app shell, built files and public files, without maps or the worker itself', () => {
    expect(
      precacheList(
        ['index.html', 'assets/index-abc.js', 'assets/index-abc.js.map', 'sw.js'],
        ['icon.svg', 'manifest.webmanifest'],
      ),
    ).toEqual(['/', '/assets/index-abc.js', '/icon.svg', '/manifest.webmanifest']);
  });
});

describe('service worker', () => {
  it('caches every listed file on install', async () => {
    const worker = startWorker();
    await worker.lifecycle('install');
    expect([...(worker.stores.get('true-shot-v1')?.keys() ?? [])]).toEqual(FILES);
  });

  it('removes caches from older builds on activate', async () => {
    const worker = startWorker('v2', ['true-shot-v1', 'someone-else']);
    await worker.lifecycle('install');
    await worker.lifecycle('activate');
    expect([...worker.stores.keys()].sort()).toEqual(['someone-else', 'true-shot-v2']);
  });

  it('serves fresh pages online and the cached app shell offline, for any route', async () => {
    const worker = startWorker();
    await worker.lifecycle('install');
    expect(await worker.request('/dev', 'navigate')).toBe('network /dev');
    worker.net.online = false;
    expect(await worker.request('/dev', 'navigate')).toBe('cached /');
  });

  it('serves built files from the cache, even offline', async () => {
    const worker = startWorker();
    await worker.lifecycle('install');
    worker.net.online = false;
    expect(await worker.request('/assets/index-abc.js')).toBe('cached /assets/index-abc.js');
  });

  it('leaves other sites alone', async () => {
    const worker = startWorker();
    expect(await worker.request('/font.woff2', 'cors', 'https://elsewhere.test')).toBeUndefined();
  });
});
