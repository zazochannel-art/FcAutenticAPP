// Etichetele de dată din aplicație sunt text liber în română (ex. „29 iulie
// 2026”). Extragem zi + lună pentru sortare și comparații aproximative.

export const MONTH_PREFIXES = {
  ian: 0, feb: 1, mar: 2, apr: 3, mai: 4, iun: 5,
  iul: 6, aug: 7, sep: 8, oct: 9, noi: 10, nov: 10, dec: 11,
};

export const MONTHS_RO = [
  "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
  "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
];

// Produce eticheta text folosită în aplicație („29 iulie 2026”), compatibilă
// cu parseRoDate.
export function formatRoDate(day, monthIndex, year) {
  return `${day} ${MONTHS_RO[monthIndex]} ${year}`;
}

export function parseRoDate(label) {
  if (!label) return null;
  const raw = String(label).trim();

  // Format ISO: 2026-07-29 (eventual cu componentă de timp).
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  // Format numeric: 29.07.2026 sau 29/07/2026 (zi.lună.an).
  const numeric = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (numeric) {
    return new Date(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
  }

  // Etichetă în română: „29 iulie 2026”.
  const m = raw.toLowerCase().match(/(\d{1,2})\s*([a-zăâîșț]+)\.?\s*(\d{4})?/);
  if (!m) return null;
  const month = MONTH_PREFIXES[m[2].slice(0, 3)];
  if (month === undefined) return null;
  return new Date(m[3] ? Number(m[3]) : new Date().getFullYear(), month, Number(m[1]));
}
