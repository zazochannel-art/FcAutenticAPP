import { searchAll } from "../search";

const data = {
  players: [
    { id: 1, no: 7, name: "Ștefan Marinescu", role: "Mijlocaș", group: "U16" },
    { id: 2, no: 1, name: "Andrei Popescu", role: "Portar", group: "U19" },
  ],
  matches: [{ id: 10, opponent: "ACS Progresul", date: "02.08.2026", group: "U16" }],
  trainings: [{ id: 20, theme: "Finalizare", date: "03.08.2026", time: "18:00", group: "U16" }],
  tasks: [{ id: 30, title: "Plata terenului", detail: "Până vineri" }],
};

describe("căutarea globală", () => {
  it("nu caută pentru mai puțin de două litere", () => {
    expect(searchAll(data, "")).toEqual([]);
    expect(searchAll(data, "a")).toEqual([]);
  });

  it("găsește în toate categoriile", () => {
    expect(searchAll(data, "u16").map((r) => r.kind).sort())
      .toEqual(["matches", "players", "trainings"]);
  });

  it("ignoră diacriticele, în ambele sensuri", () => {
    expect(searchAll(data, "stefan")).toHaveLength(1);
    expect(searchAll(data, "Ștefan")).toHaveLength(1);
    expect(searchAll(data, "mijlocas")).toHaveLength(1);
  });

  it("caută și în detalii, nu doar în titlu", () => {
    const r = searchAll(data, "portar");
    expect(r).toHaveLength(1);
    expect(r[0].title).toBe("Andrei Popescu");
  });

  it("fiecare rezultat știe pe ce pagină duce", () => {
    expect(searchAll(data, "progresul")[0].tab).toBe("Meciuri");
    expect(searchAll(data, "terenului")[0].tab).toBe("Sarcini");
    expect(searchAll(data, "finalizare")[0].tab).toBe("Antren.");
  });

  it("limitează numărul de rezultate pe categorie", () => {
    const multi = { players: Array.from({ length: 9 }, (_, i) => ({ id: i, name: `Ion ${i}` })) };
    expect(searchAll(multi, "ion")).toHaveLength(4);
    expect(searchAll(multi, "ion", { limitPerKind: 2 })).toHaveLength(2);
  });

  it("nu cade pe date lipsă", () => {
    expect(() => searchAll(undefined, "ceva")).not.toThrow();
    expect(searchAll({}, "ceva")).toEqual([]);
  });
});
