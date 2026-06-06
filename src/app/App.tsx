import { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { USERS, INITIAL_SESSIONS, type User, type Session } from "./components/mockData";

export default function App() {
  const [users, setUsers] = useState<User[]>(USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [activeAfkStart, setActiveAfkStart] = useState<Date | null>(null);

  function handleLogin(user: User) {
    setCurrentUser(user);
    const active = sessions.find((s) => s.userId === user.id && s.backAt === null);
    setActiveAfkStart(active ? active.afkAt : null);
  }

  function handleLogout() {
    setCurrentUser(null);
    setActiveAfkStart(null);
  }

  function handleAFK() {
    if (!currentUser || activeAfkStart) return;
    const now = new Date();
    const newSession: Session = {
      id: `s-${Date.now()}`,
      userId: currentUser.id,
      afkAt: now,
      backAt: null,
      durationMs: null,
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveAfkStart(now);
  }

  function handleBack() {
    if (!currentUser || !activeAfkStart) return;
    const now = new Date();
    const durationMs = now.getTime() - activeAfkStart.getTime();
    setSessions((prev) =>
      prev.map((s) =>
        s.userId === currentUser.id && s.backAt === null
          ? { ...s, backAt: now, durationMs }
          : s
      )
    );
    setActiveAfkStart(null);
  }

  function handleAddUser(newUser: User) {
    setUsers((prev) => [...prev, newUser]);
  }

  function handleRemoveUser(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setSessions((prev) => prev.filter((s) => s.userId !== userId));
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
