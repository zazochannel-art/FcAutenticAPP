import { parseScore, resultOf, seasonSummary } from "../matches";

describe("parseScore", () => {
  test("interpretează formatul „noi - ei”", () => {
    expect(parseScore("2 - 1")).toEqual({ ours: 2, theirs: 1 });
    expect(parseScore("0-0")).toEqual({ ours: 0, theirs: 0 });
    expect(parseScore("3:2")).toEqual({ ours: 3, theirs: 2 });
  });
  test("întoarce null pentru scoruri lipsă sau invalide", () => {
    expect(parseScore("")).toBeNull();
    expect(parseScore(null)).toBeNull();
    expect(parseScore("programat")).toBeNull();
  });
});

describe("resultOf", () => {
  test("clasifică victorie/egal/înfrângere", () => {
    expect(resultOf("2 - 1")).toBe("V");
    expect(resultOf("1 - 1")).toBe("E");
    expect(resultOf("0 - 3")).toBe("Î");
  });
  test("null pentru meci fără scor", () => {
    expect(resultOf("")).toBeNull();
  });
});

describe("seasonSummary", () => {
  test("agregă doar meciurile cu scor valid", () => {
    const matches = [
      { score: "2 - 1" }, // V
      { score: "1 - 1" }, // E
      { score: "0 - 2" }, // Î
      { score: "" },       // ignorat
      { score: "programat" }, // ignorat
    ];
    expect(seasonSummary(matches)).toEqual({
      wins: 1, draws: 1, losses: 1, goalsFor: 3, goalsAgainst: 4, diff: -1,
    });
  });
  test("listă goală → totul zero", () => {
    expect(seasonSummary([])).toEqual({ wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, diff: 0 });
  });
});
