import {
  playerLine,
  isAvailable,
  isActiveSuspension,
  suspendedPlayerIds,
  slotSuitability,
  POSITION_LINE,
} from "../tactics";

describe("playerLine", () => {
  it("clasifică pozițiile în text liber pe linii", () => {
    expect(playerLine("Portar")).toBe("GK");
    expect(playerLine("Fundaș central")).toBe("DEF");
    expect(playerLine("Mijlocaș")).toBe("MID");
    expect(playerLine("Atacant")).toBe("ATT");
    expect(playerLine("Extremă dreapta")).toBe("ATT");
  });
  it("cade pe MID pentru necunoscut / gol", () => {
    expect(playerLine("")).toBe("MID");
    expect(playerLine("altceva")).toBe("MID");
  });
});

describe("isAvailable", () => {
  it("marchează statusuri de indisponibilitate", () => {
    expect(isAvailable("Activ")).toBe(true);
    expect(isAvailable("Accidentat")).toBe(false);
    expect(isAvailable("Suspendat")).toBe(false);
    expect(isAvailable("În recuperare")).toBe(false);
    expect(isAvailable("Inactiv")).toBe(false);
  });
});

describe("isActiveSuspension", () => {
  const now = new Date(2026, 6, 25); // 25 iulie 2026
  it("e activă dacă data de expirare e în viitor și tipul e suspendare/roșu", () => {
    expect(isActiveSuspension({ type: "Suspendare", suspended_until: "29 iulie 2026" }, now)).toBe(true);
    expect(isActiveSuspension({ type: "Cartonaș roșu", suspended_until: "2026-07-29" }, now)).toBe(true);
  });
  it("nu e activă dacă a expirat", () => {
    expect(isActiveSuspension({ type: "Suspendare", suspended_until: "20 iulie 2026" }, now)).toBe(false);
  });
  it("nu e activă fără dată sau pentru alte tipuri", () => {
    expect(isActiveSuspension({ type: "Suspendare", suspended_until: null }, now)).toBe(false);
    expect(isActiveSuspension({ type: "Cartonaș galben", suspended_until: "29 iulie 2026" }, now)).toBe(false);
    expect(isActiveSuspension(null, now)).toBe(false);
  });
});

describe("suspendedPlayerIds", () => {
  it("întoarce set-ul de id-uri cu suspendare activă", () => {
    const now = new Date(2026, 6, 25);
    const recs = [
      { player_id: 1, type: "Suspendare", suspended_until: "29 iulie 2026" },
      { player_id: 2, type: "Cartonaș galben", suspended_until: "29 iulie 2026" },
      { player_id: 3, type: "Cartonaș roșu", suspended_until: "20 iulie 2026" },
    ];
    const ids = suspendedPlayerIds(recs, now);
    expect(ids.has(1)).toBe(true);
    expect(ids.has(2)).toBe(false);
    expect(ids.has(3)).toBe(false);
  });
});

describe("slotSuitability", () => {
  it("0 = poziție principală", () => {
    expect(slotSuitability({ role: "Fundaș" }, "CB")).toBe(0);
  });
  it("1 = poziție secundară", () => {
    expect(slotSuitability({ role: "Mijlocaș", secondaryPositions: ["CB"] }, "CB")).toBe(1);
  });
  it("2 = nepotrivit", () => {
    expect(slotSuitability({ role: "Atacant" }, "GK")).toBe(2);
    expect(slotSuitability({ role: "Atacant" }, null)).toBe(2);
  });
});

describe("POSITION_LINE", () => {
  it("mapează codurile pe linii", () => {
    expect(POSITION_LINE.GK).toBe("GK");
    expect(POSITION_LINE.ST).toBe("ATT");
    expect(POSITION_LINE.CDM).toBe("MID");
  });
});
