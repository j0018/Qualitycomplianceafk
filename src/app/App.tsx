import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { supabase } from "../lib/supabase";
import { type User, type Session } from "./types";

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeAfkStart, setActiveAfkStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const saved = localStorage.getItem("afk_current_user");
    loadUsers(saved ? JSON.parse(saved) : null);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("afk_current_user", JSON.stringify(currentUser));
      loadSessions(currentUser);
    } else {
      localStorage.removeItem("afk_current_user");
    }
  }, [currentUser?.id]);

  async function loadUsers(restoreUser: User | null = null) {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      const mapped = data.map(dbUserToUser);
      setUsers(mapped);
      // Restore logged-in user if they still exist in DB
      if (restoreUser) {
        const found = mapped.find((u) => u.id === restoreUser.id);
        if (found) setCurrentUser(found);
      }
    }
    setLoading(false);
  }

  async function loadSessions(user: User) {
    const query =
      user.role === "admin"
        ? supabase.from("sessions").select("*").order("afk_at", { ascending: false })
        : supabase.from("sessions").select("*").eq("user_id", user.id).order("afk_at", { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      const mapped = data.map(dbSessionToSession);
      setSessions(mapped);
      const active = mapped.find((s) => s.userId === user.id && s.backAt === null);
      setActiveAfkStart(active ? active.afkAt : null);
    }
  }

  function dbUserToUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      name: row.name as string,
      username: row.username as string,
      password: row.password as string,
      role: row.role as "user" | "admin",
      inviteCode: (row.invite_code as string) ?? "",
      avatarColor: (row.avatar_color as string) ?? "#5bba47",
    };
  }

  function dbSessionToSession(row: Record<string, unknown>): Session {
    const afkAt = new Date(row.afk_at as string);
    const backAt = row.back_at ? new Date(row.back_at as string) : null;
    const durationMs = row.duration_ms != null ? Number(row.duration_ms) : null;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      afkAt,
      backAt,
      durationMs,
    };
  }

  async function handleLogin(user: User) {
    setCurrentUser(user);
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveAfkStart(null);
    setSessions([]);
    localStorage.removeItem("afk_current_user");
  }

  async function handleAFK() {
    if (!currentUser || activeAfkStart) return;
    const now = new Date();
    const { data, error } = await supabase
      .from("sessions")
      .insert({ user_id: currentUser.id, afk_at: now.toISOString() })
      .select()
      .single();
    if (!error && data) {
      const newSession = dbSessionToSession(data);
      setSessions((prev) => [newSession, ...prev]);
      setActiveAfkStart(now);
    }
  }

  async function handleBack() {
    if (!currentUser || !activeAfkStart) return;
    const now = new Date();
    const durationMs = now.getTime() - activeAfkStart.getTime();
    const openSession = sessions.find((s) => s.userId === currentUser.id && s.backAt === null);
    if (!openSession) return;

    const { error } = await supabase
      .from("sessions")
      .update({ back_at: now.toISOString(), duration_ms: durationMs })
      .eq("id", openSession.id);

    if (!error) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === openSession.id ? { ...s, backAt: now, durationMs } : s
        )
      );
      setActiveAfkStart(null);
    }
  }

  async function handleAddUser(newUser: User) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        invite_code: newUser.inviteCode || null,
        avatar_color: newUser.avatarColor,
      })
      .select()
      .single();
    if (!error && data) {
      setUsers((prev) => [...prev, dbUserToUser(data)]);
    }
  }

  async function handleRemoveUser(userId: string) {
    await supabase.from("sessions").delete().eq("user_id", userId);
    await supabase.from("users").delete().eq("id", userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setSessions((prev) => prev.filter((s) => s.userId !== userId));
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "#0a0a0a", fontFamily: "'Exo 2', sans-serif" }}
      >
        <div className="text-5xl mb-6" style={{ filter: "drop-shadow(0 0 16px #e52222)" }}>🍄</div>
        <div
          className="text-sm tracking-widest animate-pulse"
          style={{ color: "#f8b800", fontFamily: "'Press Start 2P', monospace", fontSize: "12px" }}
        >
          LOADING...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage users={users} onLogin={handleLogin} />;
  }

  if (currentUser.role === "admin") {
    return (
      <AdminDashboard
        users={users}
        sessions={sessions}
        onLogout={handleLogout}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
        onRefreshSessions={() => loadSessions(currentUser)}
      />
    );
  }

  return (
    <UserDashboard
      user={currentUser}
      sessions={sessions}
      onAFK={handleAFK}
      onBack={handleBack}
      activeAfkStart={activeAfkStart}
      onLogout={handleLogout}
    />
  );
}
