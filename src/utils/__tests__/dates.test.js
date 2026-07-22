import { parseRoDate, MONTH_PREFIXES, formatRoDate } from "../dates";

describe("parseRoDate", () => {
  test("parsează o dată românească completă", () => {
    const d = parseRoDate("29 iulie 2026");
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // iulie
    expect(d.getDate()).toBe(29);
  });

  test("acceptă prefixe scurte de lună și abrevieri", () => {
    expect(parseRoDate("3 ian 2025").getMonth()).toBe(0);
    expect(parseRoDate("15 dec. 2025").getMonth()).toBe(11);
    expect(parseRoDate("1 noiembrie 2025").getMonth()).toBe(10);
  });

  test("folosește anul curent când lipsește anul", () => {
    const d = parseRoDate("5 martie");
    expect(d.getFullYear()).toBe(new Date().getFullYear());
    expect(d.getMonth()).toBe(2);
  });

  test("întoarce null pentru intrări invalide sau goale", () => {
    expect(parseRoDate("")).toBeNull();
    expect(parseRoDate(null)).toBeNull();
    expect(parseRoDate("cândva")).toBeNull();
    expect(parseRoDate("10 brumar 2026")).toBeNull(); // lună necunoscută
  });

  test("MONTH_PREFIXES acoperă toate cele 12 luni", () => {
    const distinctMonths = new Set(Object.values(MONTH_PREFIXES));
    expect(distinctMonths.size).toBe(12);
  });
});

describe("formatRoDate", () => {
  test("formatează ziua/luna/anul în etichetă românească", () => {
    expect(formatRoDate(29, 6, 2026)).toBe("29 iulie 2026");
    expect(formatRoDate(1, 0, 2027)).toBe("1 ianuarie 2027");
  });

  test("round-trip: format apoi parse dă aceeași dată", () => {
    const label = formatRoDate(15, 8, 2026); // 15 septembrie 2026
    const d = parseRoDate(label);
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(8);
    expect(d.getFullYear()).toBe(2026);
  });
});
