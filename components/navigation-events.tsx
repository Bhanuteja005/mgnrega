'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    // For client-side navigation
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      handleStart();
      originalPushState.apply(history, args);
      // We don't call handleStop here because the page is still loading.
      // The effect in the new page will call done().
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      handleStart();
      originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', handleStop);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleStop);
    };
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}
