'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    NProgress.done();
  }, [pathname, searchParams]);

  // This is a workaround to show the loading bar on navigation
  // See: https://github.com/vercel/next.js/discussions/41934
  if (typeof window !== 'undefined') {
    const pushState = window.history.pushState;
    window.history.pushState = (...args: Parameters<typeof pushState>) => {
      NProgress.start();
      return pushState.apply(window.history, args);
    };
  }

  return null;
}
