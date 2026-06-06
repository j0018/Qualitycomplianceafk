export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: "user" | "admin";
  inviteCode: string;
  avatarColor: string;
};

export type Session = {
  id: string;
  userId: string;
  afkAt: Date;
  backAt: Date | null;
  durationMs: number | null;
};

export const USERS: User[] = [
  {
    id: "admin-1",
    name: "Admin",
    username: "admin",
    password: "admin123",
    role: "admin",
    inviteCode: "",
    avatarColor: "#e52222",
  },
  {
    id: "user-1",
    name: "Luigi Verde",
    username: "luigi",
    password: "luigi123",
    role: "user",
    inviteCode: "INV-LUIGI",
    avatarColor: "#5bba47",
  },
  {
    id: "user-2",
    name: "Princess Toadstool",
    username: "peach",
    password: "peach123",
    role: "user",
    inviteCode: "INV-PEACH",
    avatarColor: "#f8b800",
  },
  {
    id: "user-3",
    name: "Toad Runner",
    username: "toad",
    password: "toad123",
    role: "user",
    inviteCode: "INV-TOAD",
    avatarColor: "#049cd8",
  },
];

const now = new Date();
const d = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000);

export const INITIAL_SESSIONS: Session[] = [
  { id: "s1", userId: "user-1", afkAt: d(8), backAt: d(7.5), durationMs: 30 * 60000 },
  { id: "s2", userId: "user-1", afkAt: d(5), backAt: d(4.25), durationMs: 45 * 60000 },
  { id: "s3", userId: "user-2", afkAt: d(7), backAt: d(6.5), durationMs: 30 * 60000 },
  { id: "s4", userId: "user-2", afkAt: d(3), backAt: d(2.5), durationMs: 30 * 60000 },
  { id: "s5", userId: "user-3", afkAt: d(6), backAt: d(5), durationMs: 60 * 60000 },
  { id: "s6", userId: "user-3", afkAt: d(2), backAt: d(1.25), durationMs: 45 * 60000 },
  { id: "s7", userId: "user-1", afkAt: d(1), backAt: d(0.5), durationMs: 30 * 60000 },
];

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export const INVITE_CODES = USERS.filter((u) => u.role === "user").map((u) => u.inviteCode);
