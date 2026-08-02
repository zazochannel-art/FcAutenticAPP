import { parseRoDate } from "./dates";

// Construiește lista de notificări din datele pe care aplicația le are deja.
//
// Până acum, „notificări” însemna doar anunțurile clubului, iar cele patru
// comutatoare din Setări se salvau fără ca nimic să le citească. Aici fiecare
// categorie devine reală și fiecare comutator o pornește sau o oprește.
//
// Funcția nu produce text gata tradus: întoarce chei și valori, iar ecranul le
// trece prin dicționar. Așa rămâne pură și se poate testa fără randare.

export const NOTIFICATION_KINDS = ["announcements", "callups", "trainings", "payments"];

const DAY = 24 * 60 * 60 * 1000;

// Cât de departe în viitor privim pentru antrenamente și meciuri.
const HORIZON_DAYS = 7;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Un eveniment intră în listă dacă e azi sau în următoarele zile.
function isUpcoming(label, now, days = HORIZON_DAYS) {
  const parsed = parseRoDate(label);
  if (!parsed) return false;
  const diff = startOfDay(parsed) - startOfDay(now);
  return diff >= 0 && diff <= days * DAY;
}

function announcementItems(announcements, now) {
  return (announcements || []).map((m) => ({
    id: `announcement-${m.id}`,
    kind: "announcements",
    titleKey: "notif.kind.announcement",
    bodyKey: null,
    body: m.text || "",
    vars: { author: m.author_name || "" },
    at: m.created_at ? new Date(m.created_at) : now,
  }));
}

function callUpItems(matches, myPlayer, isStaff, now) {
  const upcoming = (matches || []).filter((m) => isUpcoming(m.date, now, 30));

  if (myPlayer) {
    return upcoming
      .filter((m) => {
        const state = (m.callUps || {})[String(myPlayer.id)];
        return state === "titular" || state === "rezerva";
      })
      .map((m) => ({
        id: `callup-${m.id}`,
        kind: "callups",
        titleKey: "notif.kind.calledUp",
        bodyKey: "notif.matchLine",
        vars: { opponent: m.opponent || "", date: m.date || "" },
        at: parseRoDate(m.date) || now,
      }));
  }

  // Staff: le semnalăm meciurile apropiate cărora nu li s-a stabilit lotul.
  if (!isStaff) return [];
  return upcoming
    .filter((m) => Object.keys(m.callUps || {}).length === 0)
    .map((m) => ({
      id: `callup-missing-${m.id}`,
      kind: "callups",
      titleKey: "notif.kind.squadMissing",
      bodyKey: "notif.matchLine",
      vars: { opponent: m.opponent || "", date: m.date || "" },
      at: parseRoDate(m.date) || now,
    }));
}

// Antrenamentele îl privesc pe jucător (grupa lui) și pe staff (toate). Cine nu
// e nici, nici — un vizitator, de exemplu — n-are ce face cu ele.
function trainingItems(trainings, myPlayer, isStaff, now) {
  if (!myPlayer && !isStaff) return [];
  return (trainings || [])
    .filter((t) => isUpcoming(t.date, now))
    .filter((t) => !myPlayer?.group || t.group === myPlayer.group)
    .map((t) => ({
      id: `training-${t.id}`,
      kind: "trainings",
      titleKey: "notif.kind.training",
      bodyKey: "notif.trainingLine",
      vars: { date: t.date || "", time: t.time || "", location: t.location || "" },
      at: parseRoDate(t.date) || now,
    }));
}

// `monthlyPayments` e „lună-grupă” -> id jucător -> { paid, amount }.
function paymentItems(monthlyPayments, myPlayer, isStaff, now) {
  const entries = Object.entries(monthlyPayments || {});

  if (myPlayer) {
    return entries
      .filter(([, byPlayer]) => byPlayer?.[myPlayer.id] && !byPlayer[myPlayer.id].paid)
      .map(([key]) => ({
        id: `payment-${key}`,
        kind: "payments",
        titleKey: "notif.kind.feeDue",
        bodyKey: "notif.feeLine",
        vars: { period: key },
        at: now,
      }));
  }

  if (!isStaff) return [];
  let unpaid = 0;
  entries.forEach(([, byPlayer]) => {
    Object.values(byPlayer || {}).forEach((p) => { if (p && !p.paid) unpaid += 1; });
  });
  if (!unpaid) return [];
  return [{
    id: "payment-summary",
    kind: "payments",
    titleKey: "notif.kind.feesDue",
    bodyKey: "notif.feesLine",
    vars: { count: unpaid },
    at: now,
  }];
}

export function buildNotifications({
  announcements = [],
  matches = [],
  trainings = [],
  monthlyPayments = {},
  myPlayer = null,
  isStaff = false,
  prefs = {},
  now = new Date(),
} = {}) {
  const enabled = (kind) => prefs[kind] !== false;

  const items = [
    ...(enabled("announcements") ? announcementItems(announcements, now) : []),
    ...(enabled("callups") ? callUpItems(matches, myPlayer, isStaff, now) : []),
    ...(enabled("trainings") ? trainingItems(trainings, myPlayer, isStaff, now) : []),
    ...(enabled("payments") ? paymentItems(monthlyPayments, myPlayer, isStaff, now) : []),
  ];

  // Cele mai apropiate în timp primele; anunțurile au data publicării.
  return items.sort((a, b) => b.at - a.at);
}
