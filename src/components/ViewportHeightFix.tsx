"use client";

import { useEffect } from "react";

export default function ViewportHeightFix() {
  useEffect(() => {
    const setHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };

    setHeight();
    // iOS standalone PWAs sometimes report a stale/short viewport height on
    // first paint (only correcting after an orientation change forces a
    // relayout) — re-check a couple times shortly after mount to catch that.
    const retry1 = setTimeout(setHeight, 100);
    const retry2 = setTimeout(setHeight, 500);

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
