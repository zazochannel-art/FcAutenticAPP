// Scorul unui meci este text liber („2 - 1”); îl interpretăm ca „noi - ei”.
export function parseScore(score) {
  const match = String(score || "").match(/(\d+)\s*[-:]\s*(\d+)/);
  if (!match) return null;
  return { ours: Number(match[1]), theirs: Number(match[2]) };
}

// Rezultatul din perspectiva echipei: V (victorie), E (egal), Î (înfrângere).
export function resultOf(score) {
  const parsed = parseScore(score);
  if (!parsed) return null;
  if (parsed.ours > parsed.theirs) return "V";
  if (parsed.ours < parsed.theirs) return "Î";
  return "E";
}

// Bilanțul de sezon dintr-o listă de meciuri (doar cele cu scor valid contează).
export function seasonSummary(matches = []) {
  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  matches.forEach((m) => {
    const s = parseScore(m.score);
    if (!s) return;
    goalsFor += s.ours;
    goalsAgainst += s.theirs;
    if (s.ours > s.theirs) wins += 1;
    else if (s.ours < s.theirs) losses += 1;
    else draws += 1;
  });
  return { wins, draws, losses, goalsFor, goalsAgainst, diff: goalsFor - goalsAgainst };
}
