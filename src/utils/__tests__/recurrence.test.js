import { expandRecurrence, formatRoDate } from "../recurrence";

describe("seria de antrenamente", () => {
  it("produce zilele alese, pe numărul de săptămâni cerut", () => {
    // 03.08.2026 e o luni.
    const dates = expandRecurrence({ startLabel: "03.08.2026", weekdays: [2, 4], weeks: 2 });
    expect(dates).toEqual(["04.08.2026", "06.08.2026", "11.08.2026", "13.08.2026"]);
  });

  it("include ziua de start dacă e una dintre zilele alese", () => {
    const dates = expandRecurrence({ startLabel: "03.08.2026", weekdays: [1], weeks: 1 });
    expect(dates).toEqual(["03.08.2026"]);
  });

  it("trece corect peste sfârșitul lunii", () => {
    const dates = expandRecurrence({ startLabel: "31.08.2026", weekdays: [1], weeks: 3 });
    expect(dates).toEqual(["31.08.2026", "07.09.2026", "14.09.2026"]);
  });

  it("acceptă și data scrisă în cuvinte", () => {
    const dates = expandRecurrence({ startLabel: "3 august 2026", weekdays: [1], weeks: 1 });
    expect(dates).toEqual(["03.08.2026"]);
  });

  it("duminica e 7, nu 0", () => {
    const dates = expandRecurrence({ startLabel: "03.08.2026", weekdays: [7], weeks: 1 });
    expect(dates).toEqual(["09.08.2026"]);
  });

  it("nu produce nimic fără zile alese, fără dată sau cu zero săptămâni", () => {
    expect(expandRecurrence({ startLabel: "03.08.2026", weekdays: [], weeks: 4 })).toEqual([]);
    expect(expandRecurrence({ startLabel: "hopa", weekdays: [1], weeks: 4 })).toEqual([]);
    expect(expandRecurrence({ startLabel: "03.08.2026", weekdays: [1], weeks: 0 })).toEqual([]);
    expect(expandRecurrence()).toEqual([]);
  });

  it("ignoră zilele din afara intervalului 1-7", () => {
    expect(expandRecurrence({ startLabel: "03.08.2026", weekdays: [0, 9], weeks: 2 })).toEqual([]);
  });

  it("se oprește la plafonul de siguranță", () => {
    const dates = expandRecurrence({ startLabel: "03.08.2026", weekdays: [1, 2, 3, 4, 5, 6, 7], weeks: 52, max: 10 });
    expect(dates).toHaveLength(10);
  });

  it("scrie data în formatul citit de aplicație", () => {
    expect(formatRoDate(new Date(2026, 7, 3))).toBe("03.08.2026");
    expect(formatRoDate(new Date(2026, 11, 25))).toBe("25.12.2026");
  });
});
