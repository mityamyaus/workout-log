"use client";

import { useEffect, useState } from "react";

function readMetrics() {
  const vv = window.visualViewport;
  const probe = document.getElementById("__safe-area-probe__");
  const cs = probe ? getComputedStyle(probe) : null;
  const html = document.documentElement.getBoundingClientRect();
  const body = document.body.getBoundingClientRect();
  const nav = document.querySelector("nav")?.getBoundingClientRect();
  const appHeight = getComputedStyle(document.documentElement).getPropertyValue("--app-height").trim();
  return {
    t: new Date().toLocaleTimeString("ru-RU", { hour12: false }),
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    vvW: vv ? Math.round(vv.width) : null,
    vvH: vv ? Math.round(vv.height) : null,
    vvOffX: vv ? Math.round(vv.offsetLeft) : null,
    vvOffY: vv ? Math.round(vv.offsetTop) : null,
    vvScale: vv ? vv.scale : null,
    screenH: window.screen.height,
    appHeight,
    htmlH: Math.round(html.height),
    bodyTop: Math.round(body.top),
    bodyBottom: Math.round(body.bottom),
    bodyH: Math.round(body.height),
    navTop: nav ? Math.round(nav.top) : null,
    navBottom: nav ? Math.round(nav.bottom) : null,
    safeTop: cs?.paddingTop ?? null,
    safeBottom: cs?.paddingBottom ?? null,
    standalone: window.matchMedia("(display-mode: standalone)").matches,
    orientation: screen.orientation?.type ?? null,
  };
}

export default function ViewportDebugOverlay() {
  const [metrics, setMetrics] = useState<ReturnType<typeof readMetrics> | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const update = (source: string) => {
      const m = readMetrics();
      setMetrics(m);
      setLog((prev) => {
        const line = `${m.t} [${source}] app=${m.appHeight} html=${m.htmlH} vv=${m.vvW}x${m.vvH}@${m.vvOffX},${m.vvOffY} inner=${m.innerW}x${m.innerH} body=${m.bodyH}(${m.bodyTop}..${m.bodyBottom}) nav=${m.navTop}..${m.navBottom}`;
        return [...prev.slice(-16), line];
      });
    };

    update("mount");
    const onResize = () => update("resize");
    const onOrientation = () => update("orientation");
    const onVvResize = () => update("vv-resize");
    const onVvScroll = () => update("vv-scroll");
    const onPageShow = () => update("pageshow");
    const onVisibility = () => update("visibility:" + document.visibilityState);

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.visualViewport?.addEventListener("resize", onVvResize);
    window.visualViewport?.addEventListener("scroll", onVvScroll);

    const interval = setInterval(() => update("tick"), 1000);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.visualViewport?.removeEventListener("resize", onVvResize);
      window.visualViewport?.removeEventListener("scroll", onVvScroll);
      clearInterval(interval);
    };
  }, []);

  if (!metrics) return null;

  return (
    <>
      <div
        id="__safe-area-probe__"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          pointerEvents: "none",
          opacity: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: "rgba(0,0,0,0.85)",
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 9,
          lineHeight: 1.3,
          padding: "4px 6px",
          whiteSpace: "pre-wrap",
          pointerEvents: "none",
        }}
      >
        {`standalone=${metrics.standalone} orient=${metrics.orientation} screenH=${metrics.screenH}
appHeight=${metrics.appHeight} htmlRectH=${metrics.htmlH}
inner=${metrics.innerW}x${metrics.innerH}
vv=${metrics.vvW}x${metrics.vvH} off=${metrics.vvOffX},${metrics.vvOffY} scale=${metrics.vvScale}
safeTop=${metrics.safeTop} safeBottom=${metrics.safeBottom}
body=${metrics.bodyH} (${metrics.bodyTop}..${metrics.bodyBottom})
nav=${metrics.navTop}..${metrics.navBottom}
${log.join("\n")}`}
      </div>
    </>
  );
}
