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
