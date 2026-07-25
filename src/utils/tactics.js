// Logică pură pentru tactici și disponibilitate, reutilizată de ecranele
// Tactici și Meciuri. Ținută separat ca să poată fi testată unitar.
import { parseRoDate } from "./dates";

// Codul poziției (GK/CB/.../ST) → linia de teren.
export const POSITION_LINE = {
  GK: "GK",
  CB: "DEF", LB: "DEF", RB: "DEF", LWB: "DEF", RWB: "DEF",
  CDM: "MID", CM: "MID", CAM: "MID", LM: "MID", RM: "MID",
  LW: "ATT", RW: "ATT", ST: "ATT",
};

// Deduce linia (GK/DEF/MID/ATT) din poziția în text liber a jucătorului.
export function playerLine(role = "") {
  const r = String(role).toLowerCase();
  if (/portar|goalkeeper|\bgk\b/.test(r)) return "GK";
  if (/funda|apăr|apar|stoper|defen|back/.test(r)) return "DEF";
  if (/atacant|vârf|varf|extrem|arip|winger|forward|striker/.test(r)) return "ATT";
  if (/mijloc|mid|regista|central/.test(r)) return "MID";
  return "MID";
}

// Disponibilitate din statusul jucătorului (fără a lua în calcul suspendările).
export function isAvailable(status = "") {
  const s = String(status).toLowerCase();
  if (/accident|suspend|indisponibil|inactiv|lesion|recuper/.test(s)) return false;
  return true;
}

// Suspendare activă: cartonaș roșu / suspendare cu dată de expirare în viitor.
export function isActiveSuspension(rec, now = new Date()) {
  if (!rec) return false;
  if (!/suspend|roșu|rosu/i.test(rec.type || "")) return false;
  if (!rec.suspended_until) return false;
  const until = parseRoDate(rec.suspended_until);
  if (!until) return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return until >= today;
}

// Set de id-uri de jucători cu suspendare activă, din înregistrările de disciplină.
export function suspendedPlayerIds(records = [], now = new Date()) {
  return new Set(
    records.filter((r) => isActiveSuspension(r, now)).map((r) => Number(r.player_id))
  );
}

// Potrivirea unui jucător pe o poziție: 0 = poziție principală, 1 = poziție
// secundară, 2 = nepotrivit. Folosită pentru „potrivit primul” și badge-uri.
export function slotSuitability(player, slotCode) {
  if (!slotCode || !player) return 2;
  const slotLine = POSITION_LINE[slotCode];
  if (playerLine(player.role) === slotLine) return 0;
  if ((player.secondaryPositions || []).includes(slotCode)) return 1;
  return 2;
}
