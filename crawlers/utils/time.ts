/** 今天 YYYY-MM-DD（UTC） */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 距今 n 天的 YYYY-MM-DD（UTC） */
export function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
}
