import { buildNotifications } from "../notifications";

const NOW = new Date(2026, 6, 30); // 30 iulie 2026

const announcements = [
  { id: 1, text: "Ne vedem sâmbătă", author_name: "Antrenor", created_at: "2026-07-29T10:00:00Z" },
];
const matches = [
  { id: 10, opponent: "ACS Progresul", date: "02.08.2026", callUps: { "7": "titular" } },
  { id: 11, opponent: "CS Victoria", date: "03.08.2026", callUps: {} },
];
const trainings = [
  { id: 20, date: "31.07.2026", time: "18:00", location: "Teren 1", group: "U16" },
  { id: 21, date: "01.08.2026", time: "18:00", location: "Teren 2", group: "U19" },
  { id: 22, date: "30.09.2026", time: "18:00", location: "Teren 3", group: "U16" },
];
const monthlyPayments = {
  "Iulie-U16": { 7: { paid: false, amount: "300" }, 8: { paid: true, amount: "300" } },
};
const myPlayer = { id: 7, group: "U16" };

describe("construcția notificărilor", () => {
  it("adună toate categoriile pentru un jucător", () => {
    const items = buildNotifications({ announcements, matches, trainings, monthlyPayments, myPlayer, now: NOW });
    const kinds = items.map((i) => i.kind);
    expect(kinds).toContain("announcements");
    expect(kinds).toContain("callups");
    expect(kinds).toContain("trainings");
    expect(kinds).toContain("payments");
  });

  it("un comutator oprit scoate categoria din listă", () => {
    const items = buildNotifications({
      announcements, matches, trainings, monthlyPayments, myPlayer, now: NOW,
      prefs: { announcements: false, payments: false },
    });
    const kinds = items.map((i) => i.kind);
    expect(kinds).not.toContain("announcements");
    expect(kinds).not.toContain("payments");
    expect(kinds).toContain("trainings");
  });

  it("jucătorul vede doar meciurile la care e convocat", () => {
    const items = buildNotifications({ matches, myPlayer, now: NOW });
    expect(items).toHaveLength(1);
    expect(items[0].vars.opponent).toBe("ACS Progresul");
  });

  it("staff-ul vede meciurile fără lot stabilit", () => {
    const items = buildNotifications({ matches, isStaff: true, now: NOW });
    expect(items).toHaveLength(1);
    expect(items[0].titleKey).toBe("notif.kind.squadMissing");
    expect(items[0].vars.opponent).toBe("CS Victoria");
  });

  it("arată doar antrenamentele din grupa proprie și din următoarele zile", () => {
    const items = buildNotifications({ trainings, myPlayer, now: NOW });
    expect(items).toHaveLength(1); // U19 e altă grupă, iar cel din septembrie e prea departe
    expect(items[0].vars.location).toBe("Teren 1");
  });

  it("nu raportează cotizația deja achitată", () => {
    const mine = buildNotifications({ monthlyPayments, myPlayer, now: NOW });
    expect(mine).toHaveLength(1);

    const altul = buildNotifications({ monthlyPayments, myPlayer: { id: 8, group: "U16" }, now: NOW });
    expect(altul).toHaveLength(0);
  });

  it("staff-ul primește un singur rând cu numărul de restanțe", () => {
    const items = buildNotifications({ monthlyPayments, isStaff: true, now: NOW });
    expect(items).toHaveLength(1);
    expect(items[0].vars.count).toBe(1);
  });

  it("cine nu e nici jucător nici staff primește doar anunțuri", () => {
    const items = buildNotifications({ announcements, matches, trainings, monthlyPayments, now: NOW });
    expect(items.every((i) => i.kind === "announcements")).toBe(true);
  });

  it("nu cade pe date lipsă", () => {
    expect(() => buildNotifications()).not.toThrow();
    expect(buildNotifications()).toEqual([]);
  });
});
