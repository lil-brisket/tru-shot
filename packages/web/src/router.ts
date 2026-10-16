export type Route = 'home' | 'dev' | 'not-found';

export function matchRoute(pathname: string): Route {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/' || path === '') return 'home';
  if (path === '/dev') return 'dev';
  return 'not-found';
}
