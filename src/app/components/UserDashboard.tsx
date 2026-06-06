import { useState, useEffect, useRef } from "react";
import { type User, type Session, formatDuration, formatTime, formatDate } from "./mockData";

const PIXEL = "'Press Start 2P', monospace";
const CLEAN = "'Exo 2', sans-serif";

type Props = {
  user: User;
  sessions: Session[];
  onAFK: () => void;
  onBack: () => void;
  activeAfkStart: Date | null;
  onLogout: () => void;
};

export function UserDashboard({ user, sessions, onAFK, onBack, activeAfkStart, onLogout }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [showCoins, setShowCoins] = useState(false);
  const coinTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activeAfkStart) { setElapsed(0); return; }
    const interval = setInterval(() => {
      setElapsed(Date.now() - activeAfkStart.getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [activeAfkStart]);

  const isAfk = activeAfkStart !== null;
  const mySessions = sessions.filter((s) => s.userId === user.id && s.backAt !== null);
  const totalMs = mySessions.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

  function handleBack() {
    setShowCoins(true);
    if (coinTimeout.current) clearTimeout(coinTimeout.current);
    coinTimeout.current = setTimeout(() => setShowCoins(false), 1400);
    onBack();
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", fontFamily: CLEAN }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "2px solid #f8b800", background: "#111111" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center text-base font-bold"
            style={{ background: user.avatarColor, border: "2px solid rgba(255,255,255,0.3)" }}
          >
            {user.name[0]}
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#f8b800" }}>
              Player 1
            </div>
            <div className="text-sm font-bold" style={{ color: "#e8e8e8" }}>
              {user.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-sm font-semibold" style={{ color: "#5bba47" }}>
            ★ {mySessions.length} sessions
          </div>
          <button
            onClick={onLogout}
            className="text-sm font-semibold px-4 py-2 tracking-wide uppercase transition-colors hover:bg-white/5"
            style={{ color: "#666", border: "1px solid #333", fontFamily: CLEAN }}
          >
            Exit
          </button>
        </div>
      </header>

      {/* Main play area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        {/* Coin burst animation */}
        {showCoins && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl"
                style={{
                  transform: `rotate(${i * 45}deg) translateY(-60px)`,
                  animation: "fadeUp 1.2s ease-out forwards",
                }}
              >
                🪙
              </div>
            ))}
          </div>
        )}

        {/* Status pill */}
        <div
          className="mb-8 px-6 py-2 text-sm font-bold tracking-widest uppercase"
          style={{
            background: isAfk ? "#1a0000" : "#001a00",
            border: `2px solid ${isAfk ? "#e52222" : "#5bba47"}`,
            color: isAfk ? "#e52222" : "#5bba47",
          }}
        >
          {isAfk ? "● AFK Mode Active" : "● You Are Present"}
        </div>

        {/* Timer */}
        {isAfk && (
          <div className="mb-10 text-center">
            <div className="text-sm font-semibold mb-2" style={{ color: "#888" }}>
              AFK since {formatTime(activeAfkStart!)}
            </div>
            <div
              className="text-5xl font-bold tracking-widest tabular-nums"
              style={{ color: "#f8b800", textShadow: "3px 3px 0 #8b0000" }}
            >
              {formatDuration(elapsed)}
            </div>
          </div>
        )}

        {!isAfk && (
          <div className="mb-10 text-center">
            <div className="text-5xl mb-3" style={{ filter: "drop-shadow(0 0 16px #f8b800)" }}>
              🍄
            </div>
            <div className="text-sm font-semibold tracking-wide" style={{ color: "#555" }}>
              Ready to track
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-8">
          <button
            onClick={onAFK}
            disabled={isAfk}
            className="px-12 py-5 text-base font-bold tracking-widest uppercase transition-all active:translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isAfk ? "#1a1a1a" : "#e52222",
              color: "#ffffff",
              fontFamily: CLEAN,
              border: `2px solid ${isAfk ? "#333" : "#ff6666"}`,
              boxShadow: isAfk ? "none" : "0 6px 0 #8b0000, 0 0 24px rgba(229,34,34,0.35)",
            }}
          >
            💤 AFK
          </button>

          <button
            onClick={handleBack}
            disabled={!isAfk}
            className="px-12 py-5 text-base font-bold tracking-widest uppercase transition-all active:translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: !isAfk ? "#1a1a1a" : "#5bba47",
              color: "#ffffff",
              fontFamily: CLEAN,
              border: `2px solid ${!isAfk ? "#333" : "#7ddd67"}`,
              boxShadow: !isAfk ? "none" : "0 6px 0 #2d6b1f, 0 0 24px rgba(91,186,71,0.35)",
            }}
          >
            🏃 Back
          </button>
        </div>

        <div className="mt-5 text-sm font-medium" style={{ color: "#444" }}>
          {isAfk ? "Press Back when you return" : "Press AFK when you leave"}
        </div>
      </main>

      {/* Session history footer */}
      <div
        className="px-6 py-4"
        style={{ borderTop: "2px solid #1e1e1e", background: "#111111" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#888" }}>
            My AFK History
          </span>
          <span className="text-sm font-bold" style={{ color: "#f8b800" }}>
            Total: {formatDuration(totalMs)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
          {mySessions.length === 0 && (
            <div className="text-sm text-center py-4" style={{ color: "#444" }}>
              No sessions yet — go AFK!
            </div>
          )}
          {[...mySessions].reverse().map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-3 py-2"
              style={{ background: "#1a1a1a", border: "1px solid #222" }}
            >
              <span className="text-sm" style={{ color: "#666" }}>
                {formatDate(s.afkAt)} · {formatTime(s.afkAt)}
              </span>
              <span className="text-sm font-semibold" style={{ color: "#5bba47" }}>
                {formatDuration(s.durationMs!)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
