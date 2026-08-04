// Căutarea globală din antetul de desktop.
//
// Caseta exista de la început, dar era `editable={false}` cu o insignă „⌘ K”
// care nu făcea nimic — decor. Aici caută prin datele deja încărcate: nu mai e
// nevoie de nicio cerere în plus, iar rezultatele apar pe măsură ce scrii.

// Fiecare rezultat știe pe ce pagină duce, ca apăsarea lui să navigheze.
const KINDS = [
  { key: "players", tab: "Echipă", icon: "Users", label: (p) => p.name, sub: (p) => [p.no ? `#${p.no}` : "", p.role, p.group].filter(Boolean).join(" • ") },
  { key: "matches", tab: "Meciuri", icon: "Trophy", label: (m) => m.opponent, sub: (m) => [m.date, m.group].filter(Boolean).join(" • ") },
  { key: "trainings", tab: "Antren.", icon: "Dumbbell", label: (t) => t.theme || t.location || "", sub: (t) => [t.date, t.time, t.group].filter(Boolean).join(" • ") },
  { key: "tasks", tab: "Sarcini", icon: "ListChecks", label: (t) => t.title, sub: (t) => t.detail || t.meta || "" },
];

// Comparăm fără diacritice: cine caută „Stefan” trebuie să-l găsească pe
// „Ștefan”, altfel căutarea pare stricată pe o tastatură fără diacritice.
function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchAll(data = {}, query = "", { limitPerKind = 4 } = {}) {
  const needle = normalize(query).trim();
  if (needle.length < 2) return [];

  const results = [];
  KINDS.forEach(({ key, tab, icon, label, sub }) => {
    (data[key] || []).forEach((row) => {
      const title = label(row);
      const subtitle = sub(row);
      if (!title) return;
      if (!normalize(`${title} ${subtitle}`).includes(needle)) return;
      results.push({ id: `${key}-${row.id}`, kind: key, tab, icon, title, subtitle });
    });
  });

  // Cel mult câteva pe categorie, ca lista să rămână scurtă și utilă.
  const perKind = {};
  return results.filter((r) => {
    perKind[r.kind] = (perKind[r.kind] || 0) + 1;
    return perKind[r.kind] <= limitPerKind;
  });
}
