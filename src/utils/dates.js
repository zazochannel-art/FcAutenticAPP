// Etichetele de dată din aplicație sunt text liber în română (ex. „29 iulie
// 2026”). Extragem zi + lună pentru sortare și comparații aproximative.

export const MONTH_PREFIXES = {
  ian: 0, feb: 1, mar: 2, apr: 3, mai: 4, iun: 5,
  iul: 6, aug: 7, sep: 8, oct: 9, noi: 10, nov: 10, dec: 11,
};

export function parseRoDate(label) {
  if (!label) return null;
  const m = String(label).toLowerCase().match(/(\d{1,2})\s*([a-zăâîșț]+)\.?\s*(\d{4})?/);
  if (!m) return null;
  const month = MONTH_PREFIXES[m[2].slice(0, 3)];
  if (month === undefined) return null;
  return new Date(m[3] ? Number(m[3]) : new Date().getFullYear(), month, Number(m[1]));
}
