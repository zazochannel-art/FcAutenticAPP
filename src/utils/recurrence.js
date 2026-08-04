import { parseRoDate } from "./dates";

// Antrenamente recurente.
//
// Până acum fiecare antrenament se crea separat. Un club care se antrenează de
// trei ori pe săptămână, cu trei grupe, completa vreo 36 de formulare pe lună.
// Aici o singură apăsare produce toată seria.
//
// Funcția e pură: primește ziua de start, zilele din săptămână și câte
// săptămâni, și întoarce etichetele de dată. Formatul e „zz.ll.aaaa”, cel pe
// care îl citește `parseRoDate`.

const DAY = 24 * 60 * 60 * 1000;

// Luni = 1 … Duminică = 7, ca în vorbirea curentă. `getDay()` din JS pune
// duminica pe 0, de aceea traducem.
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

function isoWeekday(date) {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

export function formatRoDate(date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * @param startLabel eticheta zilei de la care pornim (inclusiv)
 * @param weekdays   zilele alese, 1 = luni … 7 = duminică
 * @param weeks      câte săptămâni ține seria
 * @param max        oprire de siguranță, ca o greșeală să nu producă mii de rânduri
 */
export function expandRecurrence({ startLabel, weekdays = [], weeks = 1, max = 120 } = {}) {
  const start = parseRoDate(startLabel);
  if (!start || !weekdays.length || weeks < 1) return [];

  const chosen = new Set(weekdays.filter((d) => WEEKDAYS.includes(d)));
  if (!chosen.size) return [];

  const dates = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  // Ne uităm zi de zi peste tot intervalul: e simplu de urmărit și intervalul e
  // mic (cel mult câteva luni).
  const totalDays = weeks * 7;
  for (let i = 0; i < totalDays && dates.length < max; i += 1) {
    const day = new Date(cursor.getTime() + i * DAY);
    if (chosen.has(isoWeekday(day))) dates.push(formatRoDate(day));
  }

  return dates;
}
