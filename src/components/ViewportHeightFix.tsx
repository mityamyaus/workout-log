"use client";

import { useEffect } from "react";

/**
 * Forces WebKit to redo the internal fixed-position/compositing
 * recalculation that, in an installed iOS PWA, otherwise only happens on a
 * real orientation change or a real scroll. A rotation isn't something JS
 * can trigger, but html now has 1px of genuine (invisible) scrollable
 * overflow on purpose (see globals.css) specifically so this scrollTo isn't
 * a no-op — it's an actual native scroll-offset change, not a simulated one.
 */
function jiggleLayout() {
  window.scrollTo(0, 1);
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event("resize"));
  });
}

export default function ViewportHeightFix() {
  useEffect(() => {
    const setHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };

    setHeight();
    // iOS standalone PWAs sometimes report a stale/short viewport height on
    // first paint (only correcting after an orientation change forces a
    // relayout) — re-check a couple times shortly after mount to catch that,
    // and force the same recalculation an orientation change would trigger.
    const retryDelays = [150, 600, 1500];
    const retries = retryDelays.map((delay) =>
      setTimeout(() => {
        setHeight();
        jiggleLayout();
      }, delay)
    );

    const onPageShow = () => {
      setHeight();
      jiggleLayout();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") onPageShow();
    };

    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);
    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      retries.forEach(clearTimeout);
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
