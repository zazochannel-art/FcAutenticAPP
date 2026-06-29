export function currentMonthLabel() {
  return new Date()
    .toLocaleDateString("ro-RO", { month: "long", year: "numeric" })
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function todayLabel() {
  return new Date().toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });
}

export function nowLabel() {
  return new Date().toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getMonthOptions(count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() + index);
    return date
      .toLocaleDateString("ro-RO", { month: "long", year: "numeric" })
      .replace(/^./, (letter) => letter.toUpperCase());
  });
}

const monthIndex = {
  ianuarie: 0,
  ian: 0,
  februarie: 1,
  feb: 1,
  martie: 2,
  mar: 2,
  aprilie: 3,
  apr: 3,
  mai: 4,
  iunie: 5,
  iun: 5,
  iulie: 6,
  iul: 6,
  august: 7,
  aug: 7,
  septembrie: 8,
  sep: 8,
  octombrie: 9,
  oct: 9,
  noiembrie: 10,
  noi: 10,
  decembrie: 11,
  dec: 11,
};

export function parseClubDate(value) {
  if (!value || value === "—") return null;
  const raw = String(value).trim();
  const iso = Date.parse(raw);
  if (!Number.isNaN(iso)) return new Date(iso);
  const [dayPart, monthPart, yearPart] = raw.toLowerCase().split(/\s+/);
  const day = Number(String(dayPart || "").replace(/[^0-9]/g, ""));
  const month = monthIndex[String(monthPart || "").replace(".", "")];
  const year = Number(yearPart) || new Date().getFullYear();
  if (!day || month === undefined) return null;
  return new Date(year, month, day);
}

export function compareClubSchedule(a, b) {
  const left = parseClubDate(a?.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const right = parseClubDate(b?.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (left !== right) return left - right;
  return String(a?.time || "").localeCompare(String(b?.time || ""));
}

export function getDateParts(value) {
  const parsed = parseClubDate(value);
  if (parsed) {
    return {
      day: String(parsed.getDate()).padStart(2, "0"),
      month: parsed.toLocaleDateString("ro-RO", { month: "short" }).replace(".", "").toUpperCase(),
    };
  }
  const parts = String(value || "—").split(" ");
  return { day: parts[0] || "—", month: parts[1]?.slice(0, 3).toUpperCase() || "" };
}
