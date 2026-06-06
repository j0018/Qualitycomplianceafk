import { useState } from "react";
import { type User } from "./mockData";

const PIXEL = "'Press Start 2P', monospace";
const CLEAN = "'Exo 2', sans-serif";

type Props = {
  users: User[];
  onLogin: (user: User) => void;
};

export function LoginPage({ users, onLogin }: Props) {
  const inviteCodes = users.filter((u) => u.role === "user").map((u) => u.inviteCode).filter(Boolean);
  const [mode, setMode] = useState<"login" | "invite">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [blink, setBlink] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const user = users.find(
      (u) => u.username === username.trim() && u.password === password
    );
    if (user) {
      onLogin(user);
    } else {
      setError("Wrong username or password");
      setBlink(true);
      setTimeout(() => setBlink(false), 600);
    }
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    const user = users.find((u) => u.inviteCode === code);
    if (user) {
      onLogin(user);
    } else {
      setError("Invalid invite code");
      setBlink(true);
      setTimeout(() => setBlink(false), 600);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#0a0a0a", fontFamily: CLEAN }}
    >
      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background: "#ffffff",
              top: `${Math.sin(i * 137.5) * 50 + 50}%`,
              left: `${Math.cos(i * 137.5) * 50 + 50}%`,
              opacity: 0.3 + (i % 4) * 0.12,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-4" style={{ filter: "drop-shadow(0 0 16px #e52222)" }}>
          🍄
        </div>
        <h1
          className="text-3xl leading-tight tracking-widest"
          style={{ color: "#f8b800", textShadow: "3px 3px 0px #e52222", fontFamily: PIXEL, fontSize: "22px" }}
        >
          AFK TRACKER
        </h1>
        <div className="mt-3 text-sm tracking-widest" style={{ color: "#5bba47", fontFamily: CLEAN, fontWeight: 600 }}>
          ★ TIME TRACKING QUEST ★
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex mb-6" style={{ border: "2px solid #f8b800" }}>
        {(["login", "invite"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setMode(t); setError(""); }}
            className="px-6 py-3 text-sm font-semibold tracking-widest transition-colors uppercase"
            style={{
              background: mode === t ? "#f8b800" : "transparent",
              color: mode === t ? "#0a0a0a" : "#f8b800",
              fontFamily: CLEAN,
            }}
          >
            {t === "login" ? "Login" : "Invite"}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm p-6 relative"
        style={{
          background: "#111111",
          border: "2px solid #f8b800",
          boxShadow: blink
            ? "0 0 30px #e52222, inset 0 0 20px rgba(229,34,34,0.1)"
            : "6px 6px 0px #f8b800",
          transition: "box-shadow 0.1s",
        }}
      >
        {mode === "login" ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2 tracking-wide" style={{ color: "#f8b800" }}>
                USERNAME
              </label>
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  background: "#1e1e1e",
                  border: "2px solid #333",
                  color: "#e8e8e8",
                  fontFamily: CLEAN,
                }}
                placeholder="mario"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 tracking-wide" style={{ color: "#f8b800" }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full px-3 py-2 text-sm outline-none"
                style={{
                  background: "#1e1e1e",
                  border: "2px solid #333",
                  color: "#e8e8e8",
                  fontFamily: CLEAN,
                }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-center" style={{ color: "#e52222" }}>{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-all active:translate-y-0.5"
              style={{
                background: "#e52222",
                color: "#ffffff",
                fontFamily: CLEAN,
                border: "2px solid #ff4444",
                boxShadow: "0 4px 0 #8b0000",
              }}
            >
              ▶ Start Game
            </button>
          </form>
        ) : (
          <form onSubmit={handleInvite} className="flex flex-col gap-5">
            <div className="text-sm text-center mb-2" style={{ color: "#888888" }}>
              Enter your invite code to join
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 tracking-wide" style={{ color: "#f8b800" }}>
                INVITE CODE
              </label>
              <input
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value); setError(""); }}
                className="w-full px-3 py-2 text-sm outline-none text-center tracking-widest"
                style={{
                  background: "#1e1e1e",
                  border: "2px solid #333",
                  color: "#5bba47",
                  fontFamily: CLEAN,
                  fontWeight: 700,
                }}
                placeholder="INV-XXXXX"
              />
            </div>
            {error && (
              <p className="text-sm text-center" style={{ color: "#e52222" }}>{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-all active:translate-y-0.5"
              style={{
                background: "#5bba47",
                color: "#ffffff",
                fontFamily: CLEAN,
                border: "2px solid #7ddd67",
                boxShadow: "0 4px 0 #2d6b1f",
              }}
            >
              ▶ Join Quest
            </button>
            <div className="text-xs text-center" style={{ color: "#555" }}>
              Available codes (demo):
              {inviteCodes.map((c) => (
                <span
                  key={c}
                  className="block mt-1 cursor-pointer hover:underline font-semibold tracking-widest"
                  style={{ color: "#5bba47" }}
                  onClick={() => setInviteCode(c)}
                >
                  {c}
                </span>
              ))}
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 text-xs tracking-widest" style={{ color: "#333", fontFamily: CLEAN }}>
        © 2026 AFK TRACKER CO.
      </div>
    </div>
  );
}
