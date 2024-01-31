export function truncateMiddle(
  str: string,
  startChars?: number,
  endChars?: number
): string {
  if (!str) return "";
  return `${str.slice(0, startChars || 4)}…${str.slice(-(endChars || 4))}`;
}
