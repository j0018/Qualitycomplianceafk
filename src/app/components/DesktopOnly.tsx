import { useEffect, useState } from "react";

const PIXEL = "'Press Start 2P', monospace";
const CLEAN = "'Exo 2', sans-serif";
const MIN_WIDTH = 1024;

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MIN_WIDTH);

  useEffect(() => {
    function check() {
      setIsDesktop(window.innerWidth >= MIN_WIDTH);
    }
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isDesktop;
}

export function DesktopOnlyWall() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#0a0a0a", fontFamily: CLEAN }}
    >
      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2,
              height: 2,
              background: "#ffffff",
              top: `${Math.sin(i * 137.5) * 50 + 50}%`,
              left: `${Math.cos(i * 137.5) * 50 + 50}%`,
              opacity: 0.2 + (i % 4) * 0.1,
            }}
          />
        ))}
      </div>

      <div className="text-6xl mb-6" style={{ filter: "drop-shadow(0 0 16px #049cd8)" }}>
        🖥️
      </div>

      <h1
        className="mb-4 leading-relaxed"
        style={{
          color: "#f8b800",
          fontFamily: PIXEL,
          fontSize: "13px",
          textShadow: "2px 2px 0px #e52222",
        }}
      >
        DESKTOP ONLY
      </h1>

      <div
        className="max-w-xs text-sm leading-relaxed mb-6"
        style={{ color: "#888", fontFamily: CLEAN }}
      >
        AFK Tracker is only available on desktop browsers.
        Please open this page on a computer.
      </div>

      <div
        className="px-4 py-2 text-xs tracking-widest uppercase"
        style={{
          border: "2px solid #333",
          color: "#444",
          fontFamily: CLEAN,
        }}
      >
        📱 Mobile access is disabled
      </div>
    </div>
  );
}
