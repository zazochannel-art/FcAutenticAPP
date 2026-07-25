import { presenceMap, computePlayerStats } from "../stats";

describe("presenceMap", () => {
  it("numără prezent/întârziat din totalul marcajelor", () => {
    const attendance = {
      10: { 1: "present", 2: "absent" },
      11: { 1: "late", 2: "present" },
    };
    const m = presenceMap(attendance);
    expect(m[1]).toEqual({ total: 2, present: 2 });
    expect(m[2]).toEqual({ total: 2, present: 1 });
  });
  it("obiect gol → hartă goală", () => {
    expect(presenceMap({})).toEqual({});
    expect(presenceMap(undefined)).toEqual({});
  });
});

describe("computePlayerStats", () => {
  const players = [
    { id: 1, name: "A", group: "U15" },
    { id: 2, name: "B", group: "U15" },
  ];
  const matches = [
    { callUps: { 1: "titular", 2: "rezerva" }, scorers: { 1: 2 } },
    { callUps: { 1: "titular" }, scorers: { 1: 1 } },
  ];
  const attendance = { 10: { 1: "present", 2: "absent" } };

  it("agregă convocări, titularizări și goluri", () => {
    const rows = computePlayerStats(players, matches, attendance);
    const a = rows.find((r) => r.id === 1);
    const b = rows.find((r) => r.id === 2);
    expect(a.convocat).toBe(2);
    expect(a.titular).toBe(2);
    expect(a.goals).toBe(3);
    expect(b.convocat).toBe(1);
    expect(b.titular).toBe(0);
    expect(b.goals).toBe(0);
  });

  it("calculează procentul de prezență (null fără marcaje)", () => {
    const rows = computePlayerStats(players, matches, attendance);
    expect(rows.find((r) => r.id === 1).att).toBe(100);
    expect(rows.find((r) => r.id === 2).att).toBe(0);
    const noAtt = computePlayerStats(players, matches, {});
    expect(noAtt[0].att).toBeNull();
  });
});
