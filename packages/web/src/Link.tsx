import type { MouseEvent, ReactNode } from 'react';

export const NAVIGATE_EVENT = 'true-shot:navigate';

export function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

export function Link({ to, children }: { to: string; children: ReactNode }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    navigate(to);
  };
  return (
    <a className="link" href={to} onClick={onClick}>
      {children}
    </a>
  );
}
