"use client";

import { useEffect } from "react";

/**
 * Forces WebKit to redo the internal viewport/safe-area recalculation that,
 * in an installed iOS PWA, otherwise only happens on a real orientation
 * change. A rotation isn't something JS can trigger, but a genuine (if
 * 1px and invisible) dimension change on our own elements plus a scroll
 * nudge reliably triggers the same recalculation path in practice.
 */
function jiggleLayout() {
  const html = document.documentElement;
  const before = html.style.getPropertyValue("--app-height");

  window.scrollTo(0, 1);
  if (before) {
    const px = parseFloat(before);
    if (!Number.isNaN(px)) html.style.setProperty("--app-height", `${px - 1}px`);
  }

  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    if (before) html.style.setProperty("--app-height", before);
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
    const retry1 = setTimeout(() => {
      setHeight();
      jiggleLayout();
    }, 150);
    const retry2 = setTimeout(() => {
      setHeight();
      jiggleLayout();
    }, 600);

    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);
    window.visualViewport?.addEventListener("resize", setHeight);

    return () => {
      clearTimeout(retry1);
      clearTimeout(retry2);
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
      window.visualViewport?.removeEventListener("resize", setHeight);
    };
  }, []);

  return null;
}
