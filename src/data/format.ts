// Small formatting helpers shared across the app. Kept separate from the store
// so components can format without importing store internals.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dateLabel = (d: Date = new Date()): string => {
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd} ${MONTHS[d.getMonth()]} ${yy}`;
};

export const timeLabel = (d: Date = new Date()): string => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const atLabel = (d: Date = new Date()): string => `${dateLabel(d)} · ${timeLabel(d)}`;

export const fmtHms = (totalSeconds: number): string => {
  const s = Math.max(0, Math.round(totalSeconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

export const parseHms = (v: string): number | null => {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
};
