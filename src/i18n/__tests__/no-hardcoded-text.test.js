const fs = require("fs");
const path = require("path");

// Zăvor pentru traduceri.
//
// Traducerea ecranelor se face în loturi. Fără ceva care să păzească, un text
// scris direct într-un ecran deja tradus trece neobservat și lotul se desface
// încet la loc. Testul verifică doar ecranele declarate mai jos ca terminate:
// pe măsură ce traduc altele, le adaug aici și zăvorul crește.
const TRANSLATED = [
  "src/screens/DashboardScreen.js",
  "src/screens/TeamScreen.js",
  "src/screens/TrainingsScreen.js",
  "src/screens/MatchesScreen.js",
  "src/screens/MoreScreen.js",
  "src/screens/NotificationsScreen.js",
  "src/components/ui/mobile-bottom-nav.js",
  "src/components/ui/mobile-top-bar.js",
  "src/components/ui/error-banner.js",
];

const ROOT = path.join(__dirname, "..", "..", "..");

// Litere care apar doar în română: dacă un șir le conține, e aproape sigur text
// pentru utilizator, nu o cheie internă.
const ROMANIAN = /[ăâîșțĂÂÎȘȚ]/;

// Scoatem comentariile: acolo scriem în română intenționat.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

// Cheile interne rămân în română pentru că sunt folosite ca chei de obiect —
// gruparea pe posturi, coșurile de disponibilitate, tipurile de meci. Ele apar
// în poziții de cod, nu de text, deci ne uităm doar unde se vede ceva.
const VISIBLE_PATTERNS = [
  // <Text ...>Text românesc</Text>
  />\s*([^<>{}\n]*[ăâîșțĂÂÎȘȚ][^<>{}\n]*?)\s*</g,
  // label="..." title="..." placeholder="..."
  /\b(?:label|title|placeholder|eyebrow|subtitle)\s*=\s*"([^"]*[ăâîșțĂÂÎȘȚ][^"]*)"/g,
];

function findHardcoded(source) {
  const clean = stripComments(source);
  const hits = new Set();
  VISIBLE_PATTERNS.forEach((pattern) => {
    let match;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((match = re.exec(clean)) !== null) {
      const text = (match[1] || "").trim();
      if (text && ROMANIAN.test(text)) hits.add(text);
    }
  });
  return [...hits];
}

describe("ecranele traduse rămân traduse", () => {
  it.each(TRANSLATED)("%s nu are text scris direct în componentă", (file) => {
    const full = path.join(ROOT, file);
    const source = fs.readFileSync(full, "utf8");
    const hits = findHardcoded(source);
    expect(hits).toEqual([]);
  });

  it("detectorul chiar prinde ceva", () => {
    expect(findHardcoded('<Text style={s.x}>Niciun jucător</Text>')).toEqual(["Niciun jucător"]);
    expect(findHardcoded('<BeUIButton label="Salvează" />')).toEqual(["Salvează"]);
  });

  it("nu se plânge de comentarii sau de chei interne", () => {
    expect(findHardcoded('// Aici explicăm ceva în română\nconst x = 1;')).toEqual([]);
    expect(findHardcoded('const buckets = { "Accidentați": 0 };')).toEqual([]);
    expect(findHardcoded("<Text>{t('team.title')}</Text>")).toEqual([]);
  });
});
