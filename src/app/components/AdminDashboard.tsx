import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { type User, type Session, formatDuration, formatTime, formatDate } from "../types";

const PIXEL = "'Press Start 2P', monospace";
const CLEAN = "'Exo 2', sans-serif";
const COLORS = ["#e52222", "#5bba47", "#049cd8", "#f8b800", "#a020f0"];
const AVATAR_COLORS = ["#5bba47", "#049cd8", "#f8b800", "#a020f0", "#ff6600", "#00cccc"];

type Tab = "live" | "logs" | "reports" | "invites";

function PixelTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-sm font-semibold"
      style={{ background: "#111", border: "2px solid #f8b800", color: "#f8b800", fontFamily: CLEAN }}
    >
      {formatDuration(payload[0].value)}
    </div>
  );
}

function LiveTimer({ since }: { since: Date }) {
  const [elapsed, setElapsed] = useState(Date.now() - since.getTime());
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - since.getTime()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return (
    <span className="font-bold tabular-nums" style={{ color: "#e52222" }}>
      {formatDuration(elapsed)}
    </span>
  );
}

type Props = {
  users: User[];
  sessions: Session[];
  onLogout: () => void;
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onRefreshSessions?: () => void;
};

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `INV-${part()}`;
}

type NewUserForm = {
  name: string;
  username: string;
  password: string;
  role: "user" | "admin";
};

// ── Helper: get Monday of current week
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString().slice(0, 10);
}
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminDashboard({ users, sessions, onLogout, onAddUser, onRemoveUser, onRefreshSessions }: Props) {
  const [tab, setTab] = useState<Tab>("live");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [reportUserId, setReportUserId] = useState<string>(
    users.find((u) => u.role === "user")?.id ?? ""
  );
  const [newUser, setNewUser] = useState<NewUserForm>({ name: "", username: "", password: "", role: "user" });
  const [generatedCode, setGeneratedCode] = useState("");
  const [formError, setFormError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  // Export date range
  const [exportFrom, setExportFrom] = useState(getWeekStart());
  const [exportTo, setExportTo] = useState(getToday());
  const [exportUserId, setExportUserId] = useState<string>("all");

  const regularUsers = users.filter((u) => u.role === "user");
  const completedSessions = sessions.filter((s) => s.backAt !== null);
  const activeSessions = sessions.filter((s) => s.backAt === null);

  const filteredLogs =
    selectedUserId === "all"
      ? completedSessions
      : completedSessions.filter((s) => s.userId === selectedUserId);
  const sortedLogs = [...filteredLogs].sort((a, b) => b.afkAt.getTime() - a.afkAt.getTime());

  const chartData = regularUsers.map((u, i) => {
    const userSessions = completedSessions.filter((s) => s.userId === u.id);
    const totalMs = userSessions.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
    return { name: u.name.split(" ")[0], totalMs, color: COLORS[i % COLORS.length] };
  });

  const reportUser = regularUsers.find((u) => u.id === reportUserId);
  const reportSessions = completedSessions
    .filter((s) => s.userId === reportUserId)
    .sort((a, b) => b.afkAt.getTime() - a.afkAt.getTime());
  const reportTotal = reportSessions.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
  const reportAvg = reportSessions.length > 0 ? reportTotal / reportSessions.length : 0;
  const reportLongest = reportSessions.length > 0 ? Math.max(...reportSessions.map((s) => s.durationMs ?? 0)) : 0;

  // ── Export helpers
  function getExportSessions() {
    const from = new Date(exportFrom + "T00:00:00");
    const to = new Date(exportTo + "T23:59:59");
    return completedSessions.filter((s) => {
      const inRange = s.afkAt >= from && s.afkAt <= to;
      const inUser = exportUserId === "all" || s.userId === exportUserId;
      return inRange && inUser;
    }).sort((a, b) => a.afkAt.getTime() - b.afkAt.getTime());
  }

  function exportCSV() {
    const rows = getExportSessions();
    if (rows.length === 0) { alert("No sessions in selected range."); return; }
    const header = ["Player", "Date", "AFK Start", "AFK End", "Duration (min)"];
    const lines = rows.map((s) => {
      const user = users.find((u) => u.id === s.userId);
      return [
        user?.name ?? "Unknown",
        formatDate(s.afkAt),
        formatTime(s.afkAt),
        s.backAt ? formatTime(s.backAt) : "",
        s.durationMs != null ? (s.durationMs / 60000).toFixed(1) : "",
      ].map((v) => `"${v}"`).join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `afk-report-${exportFrom}-to-${exportTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const rows = getExportSessions();
    if (rows.length === 0) { alert("No sessions in selected range."); return; }

    const exportUser = exportUserId === "all" ? "All Players" : (users.find(u => u.id === exportUserId)?.name ?? "");
    const totalMs = rows.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

    const tableRows = rows.map((s, i) => {
      const user = users.find((u) => u.id === s.userId);
      return `
        <tr style="background:${i % 2 === 0 ? "#f9f9f9" : "#ffffff"}">
          <td>${user?.name ?? "Unknown"}</td>
          <td>${formatDate(s.afkAt)}</td>
          <td>${formatTime(s.afkAt)}</td>
          <td>${s.backAt ? formatTime(s.backAt) : "—"}</td>
          <td>${s.durationMs != null ? formatDuration(s.durationMs) : "—"}</td>
        </tr>`;
    }).join("");

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8">
      <title>AFK Report</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
        .summary { display: flex; gap: 24px; margin-bottom: 24px; }
        .stat { background: #f4f4f4; padding: 12px 20px; border-radius: 6px; }
        .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .stat-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #111; color: #fff; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 9px 12px; border-bottom: 1px solid #eee; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      <h1>🍄 AFK Tracker — Report</h1>
      <div class="meta">
        Period: <strong>${exportFrom}</strong> to <strong>${exportTo}</strong> &nbsp;|&nbsp;
        Player: <strong>${exportUser}</strong> &nbsp;|&nbsp;
        Generated: ${new Date().toLocaleString()}
      </div>
      <div class="summary">
        <div class="stat"><div class="stat-label">Total Sessions</div><div class="stat-value">${rows.length}</div></div>
        <div class="stat"><div class="stat-label">Total AFK Time</div><div class="stat-value">${formatDuration(totalMs)}</div></div>
        <div class="stat"><div class="stat-label">Avg per Session</div><div class="stat-value">${rows.length > 0 ? formatDuration(totalMs / rows.length) : "—"}</div></div>
      </div>
      <table>
        <thead><tr><th>Player</th><th>Date</th><th>AFK Start</th><th>AFK End</th><th>Duration</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      </body></html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to export PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "live", label: "Live Status", icon: "🔴" },
    { id: "logs", label: "Logs", icon: "📋" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "invites", label: "Manage Users", icon: "🎟" },
  ];

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      setFormError("All fields are required.");
      return;
    }
    if (users.some((u) => u.username === newUser.username.trim())) {
      setFormError("Username already taken.");
      return;
    }
    const code = newUser.role === "user" ? generateInviteCode() : "";
    const colorIdx = users.filter((u) => u.role === "user").length % AVATAR_COLORS.length;
    const created: User = {
      id: `user-${Date.now()}`,
      name: newUser.name.trim(),
      username: newUser.username.trim(),
      password: newUser.password.trim(),
      role: newUser.role,
      inviteCode: code,
      avatarColor: newUser.role === "admin" ? "#e52222" : AVATAR_COLORS[colorIdx],
    };
    onAddUser(created);
    setGeneratedCode(code);
    setNewUser({ name: "", username: "", password: "", role: "user" });
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0a0a", fontFamily: CLEAN }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "2px solid #e52222", background: "#111111" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center text-base font-bold"
            style={{ background: "#e52222", border: "2px solid #ff4444" }}
          >
            A
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#e52222" }}>
              Admin Panel
            </div>
            <div
              className="mt-0.5 tracking-widest"
              style={{ color: "#e8e8e8", fontFamily: PIXEL, fontSize: "9px" }}
            >
              AFK TRACKER
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                background: activeSessions.length > 0 ? "#e52222" : "#444",
                boxShadow: activeSessions.length > 0 ? "0 0 8px #e52222" : "none",
              }}
            />
            <span className="text-sm font-semibold" style={{ color: activeSessions.length > 0 ? "#e52222" : "#555" }}>
              {activeSessions.length} AFK now
            </span>
          </div>
          <div className="text-sm font-semibold" style={{ color: "#f8b800" }}>
            🍄 {regularUsers.length} players
          </div>
          <button
            onClick={onLogout}
            className="text-sm font-semibold px-4 py-2 uppercase tracking-wide transition-colors hover:bg-white/5"
            style={{ color: "#666", border: "1px solid #333", fontFamily: CLEAN }}
          >
            Exit
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "2px solid #1e1e1e", background: "#111" }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-6 py-3 text-sm font-semibold tracking-wide uppercase transition-colors relative"
            style={{
              color: tab === t.id ? "#fff" : "#666",
              fontFamily: CLEAN,
              borderBottom: tab === t.id ? "2px solid #e52222" : "2px solid transparent",
              marginBottom: "-2px",
            }}
          >
            {t.icon} {t.label}
            {t.id === "live" && activeSessions.length > 0 && (
              <span
                className="ml-2 text-xs px-1.5 py-0.5 font-bold"
                style={{ background: "#e52222", color: "#fff" }}
              >
                {activeSessions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* ── LIVE STATUS ── */}
        {tab === "live" && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: "#e52222",
                  boxShadow: "0 0 8px #e52222",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "#e52222" }}>
                Live AFK Status
              </span>
            </div>

            {/* All player cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {regularUsers.map((u, i) => {
                const activeSession = activeSessions.find((s) => s.userId === u.id);
                const isAfk = !!activeSession;
                const color = COLORS[i % COLORS.length];
                const userTotal = completedSessions
                  .filter((s) => s.userId === u.id)
                  .reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

                return (
                  <div
                    key={u.id}
                    className="p-4"
                    style={{
                      background: "#111",
                      border: `2px solid ${isAfk ? "#e52222" : "#222"}`,
                      boxShadow: isAfk ? "0 0 16px rgba(229,34,34,0.2)" : "none",
                      transition: "border-color 0.3s, box-shadow 0.3s",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 flex items-center justify-center text-base font-bold"
                          style={{ background: color, border: "2px solid rgba(255,255,255,0.2)" }}
                        >
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: "#e8e8e8" }}>
                            {u.name}
                          </div>
                          <div className="text-xs" style={{ color: "#555" }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 px-3 py-1 text-xs font-bold tracking-wide uppercase"
                        style={{
                          background: isAfk ? "rgba(229,34,34,0.15)" : "rgba(91,186,71,0.1)",
                          border: `1px solid ${isAfk ? "#e52222" : "#5bba47"}`,
                          color: isAfk ? "#e52222" : "#5bba47",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: isAfk ? "#e52222" : "#5bba47",
                            boxShadow: isAfk ? "0 0 6px #e52222" : "none",
                          }}
                        />
                        {isAfk ? "AFK" : "Present"}
                      </div>
                    </div>

                    {isAfk && activeSession && (
                      <div
                        className="px-3 py-2 mb-3"
                        style={{ background: "#1a0000", border: "1px solid #3a0000" }}
                      >
                        <div className="text-xs mb-1" style={{ color: "#888" }}>
                          AFK since {formatTime(activeSession.afkAt)}
                        </div>
                        <div className="text-sm font-semibold">
                          Gone for: <LiveTimer since={activeSession.afkAt} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs" style={{ color: "#555" }}>
                      <span>
                        {completedSessions.filter((s) => s.userId === u.id).length} sessions
                      </span>
                      <span>Total AFK: <span style={{ color: "#888" }}>{formatDuration(userTotal)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {regularUsers.length === 0 && (
              <div className="text-sm text-center py-12" style={{ color: "#444" }}>
                No players registered yet
              </div>
            )}
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div>
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#888" }}>
                Filter:
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedUserId("all")}
                  className="px-3 py-1 text-sm font-semibold uppercase tracking-wide transition-colors"
                  style={{
                    background: selectedUserId === "all" ? "#f8b800" : "#1e1e1e",
                    color: selectedUserId === "all" ? "#0a0a0a" : "#888",
                    border: "1px solid #333",
                    fontFamily: CLEAN,
                  }}
                >
                  All
                </button>
                {regularUsers.map((u, i) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="px-3 py-1 text-sm font-semibold uppercase tracking-wide transition-colors"
                    style={{
                      background: selectedUserId === u.id ? COLORS[i % COLORS.length] : "#1e1e1e",
                      color: selectedUserId === u.id ? "#fff" : "#888",
                      border: `1px solid ${selectedUserId === u.id ? COLORS[i % COLORS.length] : "#333"}`,
                      fontFamily: CLEAN,
                    }}
                  >
                    {u.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ border: "2px solid #1e1e1e" }}>
              <div
                className="grid text-xs font-semibold tracking-widest uppercase px-4 py-2"
                style={{
                  gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                  background: "#1a1a1a",
                  color: "#666",
                  borderBottom: "2px solid #222",
                }}
              >
                <span>Player</span>
                <span>Date</span>
                <span>AFK Time</span>
                <span>Back Time</span>
                <span>Duration</span>
              </div>
              {sortedLogs.length === 0 && (
                <div className="text-sm text-center py-8" style={{ color: "#444" }}>
                  No logs found
                </div>
              )}
              {sortedLogs.map((s, i) => {
                const u = users.find((u) => u.id === s.userId);
                const uIdx = regularUsers.findIndex((u) => u.id === s.userId);
                return (
                  <div
                    key={s.id}
                    className="grid text-sm px-4 py-3"
                    style={{
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
                      background: i % 2 === 0 ? "#0e0e0e" : "#111111",
                      borderBottom: "1px solid #191919",
                    }}
                  >
                    <span className="font-semibold" style={{ color: COLORS[uIdx % COLORS.length] }}>
                      {u?.name.split(" ")[0] ?? "—"}
                    </span>
                    <span style={{ color: "#666" }}>{formatDate(s.afkAt)}</span>
                    <span style={{ color: "#e8e8e8" }}>{formatTime(s.afkAt)}</span>
                    <span style={{ color: "#e8e8e8" }}>{s.backAt ? formatTime(s.backAt) : "—"}</span>
                    <span className="font-semibold" style={{ color: "#5bba47" }}>
                      {s.durationMs != null ? formatDuration(s.durationMs) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs" style={{ color: "#444" }}>
              {sortedLogs.length} records
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div>
            {/* ── Overview chart ── */}
            <div className="p-5 mb-6" style={{ background: "#111", border: "2px solid #1e1e1e" }}>
              <div className="text-sm font-bold tracking-wide uppercase mb-4" style={{ color: "#f8b800" }}>
                ★ Total AFK Time — All Players
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 12, fontFamily: CLEAN }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<PixelTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="totalMs" radius={0}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Player detail ── */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#888" }}>Player:</span>
              {regularUsers.map((u, i) => (
                <button key={u.id} onClick={() => setReportUserId(u.id)}
                  className="px-4 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors"
                  style={{
                    background: reportUserId === u.id ? COLORS[i % COLORS.length] : "#1e1e1e",
                    color: reportUserId === u.id ? "#fff" : "#888",
                    border: `1px solid ${reportUserId === u.id ? COLORS[i % COLORS.length] : "#333"}`,
                    fontFamily: CLEAN,
                  }}
                >
                  {u.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {reportUser && (
              <div className="mb-8">
                <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
                  {[
                    { label: "Total AFK", value: formatDuration(reportTotal), icon: "⏱" },
                    { label: "Sessions", value: `${reportSessions.length}`, icon: "🎮" },
                    { label: "Avg Session", value: formatDuration(reportAvg), icon: "📊" },
                    { label: "Longest AFK", value: formatDuration(reportLongest), icon: "💤" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4" style={{ background: "#111", border: "2px solid #1e1e1e", boxShadow: "3px 3px 0 #f8b800" }}>
                      <div className="text-xl mb-2">{stat.icon}</div>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#666" }}>{stat.label}</div>
                      <div className="text-base font-bold" style={{ color: "#f8b800" }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "#888" }}>
                  Session History — {reportUser.name}
                </div>
                <div style={{ border: "2px solid #1e1e1e" }}>
                  {reportSessions.length === 0 && (
                    <div className="text-sm text-center py-6" style={{ color: "#444" }}>No sessions yet</div>
                  )}
                  {reportSessions.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3"
                      style={{ background: i % 2 === 0 ? "#0e0e0e" : "#111111", borderBottom: "1px solid #191919" }}>
                      <div>
                        <div className="text-xs font-medium" style={{ color: "#666" }}>{formatDate(s.afkAt)}</div>
                        <div className="text-sm mt-0.5" style={{ color: "#e8e8e8" }}>
                          {formatTime(s.afkAt)} → {s.backAt ? formatTime(s.backAt) : "..."}
                        </div>
                      </div>
                      <div className="text-base font-bold" style={{ color: "#5bba47" }}>
                        {s.durationMs != null ? formatDuration(s.durationMs) : "Active"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Export section ── */}
            <div className="p-5" style={{ background: "#111", border: "2px solid #f8b800", boxShadow: "4px 4px 0 #f8b800" }}>
              <div className="text-sm font-bold tracking-wide uppercase mb-5" style={{ color: "#f8b800", fontFamily: CLEAN }}>
                ★ Export Report
              </div>

              <div className="flex flex-wrap gap-5 mb-5 items-end">
                {/* From */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>From</label>
                  <input
                    type="date"
                    value={exportFrom}
                    onChange={(e) => setExportFrom(e.target.value)}
                    className="px-3 py-2 text-sm outline-none"
                    style={{ background: "#1a1a1a", border: "2px solid #2a2a2a", color: "#e8e8e8", fontFamily: CLEAN, colorScheme: "dark" }}
                  />
                </div>
                {/* To */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>To</label>
                  <input
                    type="date"
                    value={exportTo}
                    onChange={(e) => setExportTo(e.target.value)}
                    className="px-3 py-2 text-sm outline-none"
                    style={{ background: "#1a1a1a", border: "2px solid #2a2a2a", color: "#e8e8e8", fontFamily: CLEAN, colorScheme: "dark" }}
                  />
                </div>
                {/* Player filter */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>Player</label>
                  <select
                    value={exportUserId}
                    onChange={(e) => setExportUserId(e.target.value)}
                    className="px-3 py-2 text-sm outline-none"
                    style={{ background: "#1a1a1a", border: "2px solid #2a2a2a", color: "#e8e8e8", fontFamily: CLEAN }}
                  >
                    <option value="all">All Players</option>
                    {regularUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quick presets */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    {
                      label: "This Week", onClick: () => {
                        setExportFrom(getWeekStart());
                        setExportTo(getToday());
                      }
                    },
                    {
                      label: "This Month", onClick: () => {
                        const d = new Date();
                        setExportFrom(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
                        setExportTo(getToday());
                      }
                    },
                    {
                      label: "Last Month", onClick: () => {
                        const d = new Date();
                        const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                        const last = new Date(d.getFullYear(), d.getMonth(), 0);
                        setExportFrom(first.toISOString().slice(0, 10));
                        setExportTo(last.toISOString().slice(0, 10));
                      }
                    },
                  ].map((p) => (
                    <button key={p.label} onClick={p.onClick}
                      className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                      style={{ background: "#1a1a1a", color: "#888", border: "1px solid #333", fontFamily: CLEAN }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex gap-3">
                <button
                  onClick={exportCSV}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all active:translate-y-0.5"
                  style={{ background: "#5bba47", color: "#fff", border: "2px solid #7ddd67", boxShadow: "0 4px 0 #2d6b1f", fontFamily: CLEAN }}
                >
                  ↓ Export CSV
                </button>
                <button
                  onClick={exportPDF}
                  className="px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all active:translate-y-0.5"
                  style={{ background: "#049cd8", color: "#fff", border: "2px solid #2cc0ff", boxShadow: "0 4px 0 #025a80", fontFamily: CLEAN }}
                >
                  ↓ Export PDF
                </button>
              </div>

              <div className="mt-3 text-xs" style={{ color: "#555" }}>
                PDF opens a print dialog — save as PDF from there. CSV opens directly in Excel.
              </div>
            </div>
          </div>
        )}

        {/* ── INVITE MANAGER ── */}
        {tab === "invites" && (
          <div className="flex gap-6" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
            {/* Create user form */}
            <div className="flex-1" style={{ minWidth: 280, maxWidth: 400 }}>
              <div className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "#f8b800" }}>
                ★ Create New Account
              </div>
              <form
                onSubmit={handleCreateUser}
                className="flex flex-col gap-4 p-5"
                style={{ background: "#111", border: "2px solid #1e1e1e", boxShadow: "4px 4px 0 #f8b800" }}
              >
                {[
                  { label: "Full Name", key: "name", placeholder: "e.g. Wario Gold", type: "text" },
                  { label: "Username", key: "username", placeholder: "e.g. wario", type: "text" },
                  { label: "Password", key: "password", placeholder: "Set a password", type: "text" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={newUser[field.key as keyof NewUserForm]}
                      onChange={(e) => { setNewUser((p) => ({ ...p, [field.key]: e.target.value })); setFormError(""); setGeneratedCode(""); }}
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: "#1a1a1a", border: "2px solid #2a2a2a", color: "#e8e8e8", fontFamily: CLEAN }}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#888" }}>
                    Role
                  </label>
                  <div className="flex gap-2">
                    {(["user", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewUser((p) => ({ ...p, role: r }))}
                        className="flex-1 py-2 text-sm font-semibold uppercase tracking-wide transition-colors"
                        style={{
                          background: newUser.role === r ? (r === "admin" ? "#e52222" : "#5bba47") : "#1a1a1a",
                          color: newUser.role === r ? "#fff" : "#666",
                          border: `2px solid ${newUser.role === r ? (r === "admin" ? "#e52222" : "#5bba47") : "#2a2a2a"}`,
                          fontFamily: CLEAN,
                        }}
                      >
                        {r === "admin" ? "👑 Admin" : "🎮 User"}
                      </button>
                    ))}
                  </div>
                  {newUser.role === "user" && (
                    <p className="text-xs mt-1.5" style={{ color: "#555" }}>
                      An invite code will be generated for this user.
                    </p>
                  )}
                  {newUser.role === "admin" && (
                    <p className="text-xs mt-1.5" style={{ color: "#555" }}>
                      Admin can log in with username + password directly.
                    </p>
                  )}
                </div>

                {formError && (
                  <p className="text-sm font-semibold" style={{ color: "#e52222" }}>{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 text-sm font-bold uppercase tracking-widest transition-all active:translate-y-0.5"
                  style={{
                    background: "#f8b800",
                    color: "#0a0a0a",
                    fontFamily: CLEAN,
                    border: "2px solid #ffd040",
                    boxShadow: "0 4px 0 #a07000",
                  }}
                >
                  ▶ Create Account
                </button>

                {/* Success — show generated code */}
                {generatedCode && (
                  <div
                    className="p-4 text-center"
                    style={{ background: "#001a00", border: "2px solid #5bba47" }}
                  >
                    <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#5bba47" }}>
                      ✓ Account created! Invite code:
                    </div>
                    <div
                      className="text-xl font-bold tracking-widest mb-3"
                      style={{ color: "#f8b800", fontFamily: CLEAN }}
                    >
                      {generatedCode}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedCode)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wide"
                      style={{
                        background: copiedCode === generatedCode ? "#5bba47" : "#1a1a1a",
                        color: copiedCode === generatedCode ? "#fff" : "#888",
                        border: "1px solid #333",
                        fontFamily: CLEAN,
                      }}
                    >
                      {copiedCode === generatedCode ? "✓ Copied!" : "Copy Code"}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Existing accounts list */}
            <div className="flex-1" style={{ minWidth: 280 }}>
              <div className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "#f8b800" }}>
                ★ All Accounts ({users.length})
              </div>
              <div className="flex flex-col gap-2">
                {users.map((u, i) => {
                  const isAdmin = u.role === "admin";
                  return (
                    <div
                      key={u.id}
                      className="px-4 py-3 flex items-center gap-3"
                      style={{
                        background: "#111",
                        border: `2px solid ${isAdmin ? "#2a0000" : "#1e1e1e"}`,
                      }}
                    >
                      <div
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm font-bold"
                        style={{ background: u.avatarColor, border: "2px solid rgba(255,255,255,0.15)" }}
                      >
                        {u.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: "#e8e8e8" }}>
                            {u.name}
                          </span>
                          <span
                            className="text-xs px-1.5 py-0.5 font-bold uppercase tracking-wide"
                            style={{
                              background: isAdmin ? "rgba(229,34,34,0.2)" : "rgba(91,186,71,0.1)",
                              color: isAdmin ? "#e52222" : "#5bba47",
                              border: `1px solid ${isAdmin ? "#e52222" : "#5bba47"}`,
                            }}
                          >
                            {isAdmin ? "Admin" : "User"}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "#555" }}>
                          @{u.username}
                          {u.inviteCode && (
                            <span className="ml-2" style={{ color: "#888" }}>
                              · Code: <span style={{ color: "#f8b800" }}>{u.inviteCode}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.inviteCode && (
                          <button
                            onClick={() => copyToClipboard(u.inviteCode)}
                            className="text-xs px-2 py-1 font-semibold uppercase tracking-wide"
                            style={{
                              background: copiedCode === u.inviteCode ? "#5bba47" : "#1a1a1a",
                              color: copiedCode === u.inviteCode ? "#fff" : "#666",
                              border: "1px solid #333",
                              fontFamily: CLEAN,
                            }}
                            title="Copy invite code"
                          >
                            {copiedCode === u.inviteCode ? "✓" : "Copy"}
                          </button>
                        )}
                        {confirmRemove === u.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => { onRemoveUser(u.id); setConfirmRemove(null); }}
                              className="text-xs px-2 py-1 font-bold"
                              style={{ background: "#e52222", color: "#fff", border: "1px solid #ff4444", fontFamily: CLEAN }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmRemove(null)}
                              className="text-xs px-2 py-1 font-semibold"
                              style={{ background: "#1a1a1a", color: "#888", border: "1px solid #333", fontFamily: CLEAN }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemove(u.id)}
                            className="text-xs px-2 py-1 font-semibold uppercase tracking-wide"
                            style={{
                              background: "#1a0000",
                              color: "#e52222",
                              border: "1px solid #3a0000",
                              fontFamily: CLEAN,
                            }}
                            title="Remove account"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}


