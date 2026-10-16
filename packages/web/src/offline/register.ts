// The offline cache only runs in the built app; in `npm run dev` it would serve stale pages.
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('Offline cache unavailable:', error);
    });
  });
}
