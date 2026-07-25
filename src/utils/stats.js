// Agregarea statisticilor de jucător (meciuri, goluri, prezență), extrasă din
// ecranul Statistici ca să fie testabilă unitar.

// Prezența per jucător din obiectul attendance ({ trainingId: { playerId: status } }).
export function presenceMap(attendance = {}) {
  const stats = {};
  Object.values(attendance || {}).forEach((byPlayer) => {
    Object.entries(byPlayer || {}).forEach(([pId, status]) => {
      if (!stats[pId]) stats[pId] = { total: 0, present: 0 };
      stats[pId].total += 1;
      if (status === "present" || status === "late") stats[pId].present += 1;
    });
  });
  return stats;
}

// Pentru fiecare jucător: nr. convocări, titularizări, goluri și procent prezență.
export function computePlayerStats(players = [], matches = [], attendance = {}) {
  const presence = presenceMap(attendance);
  return players.map((p) => {
    let convocat = 0, titular = 0, goals = 0;
    matches.forEach((m) => {
      const st = (m.callUps || {})[String(p.id)];
      if (st === "titular") { convocat++; titular++; }
      else if (st === "rezerva") { convocat++; }
      const sc = m.scorers || {};
      goals += Number(sc[String(p.id)] ?? sc[p.id] ?? 0);
    });
    const pres = presence[p.id] || { total: 0, present: 0 };
    const att = pres.total ? Math.round((pres.present / pres.total) * 100) : null;
    return { ...p, convocat, titular, goals, att, presTotal: pres.total };
  });
}
