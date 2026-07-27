// Sistem de design unificat al aplicației.
// Paletă neutră (zinc) cu accente reținute — fundal aproape negru, suprafețe
// stratificate și borduri discrete. Accentele se folosesc doar în punctele
// focale (nu ca borduri peste tot), pentru un aspect modern, curat.
// Accentul principal: verde-gazon, potrivit tematic cu fotbalul.
// Cheia `cyan` rămâne ca alias istoric (e folosită în ~260 de locuri);
// numele nou și corect este `accent`.
// Design transcris din Kultura (zazochannel-art.github.io/Kultura) —
// aceleași tokenuri de culoare, raze, umbre și gradienți.
const ACCENT = "#06B6D4";   // --accent
const ACCENT_2 = "#8B5CF6"; // --accent-2

export const palettes = {
  dark: {
    // --bg / --surface / --surface-solid / --surface-elev
    bg: "#09090B",
    bgSecondary: "#0F0F12",
    bgElevated: "#1F1F23",
    card: "rgba(24,24,27,0.72)",
    cardSolid: "#18181B",
    cardHover: "#1F1F23",
    cardLight: "#212126",

    // --card-grad (suprapunere albă foarte fină peste suprafață)
    cardGradFrom: "rgba(255,255,255,0.055)",
    cardGradTo: "rgba(255,255,255,0.022)",
    cardGradStrongFrom: "rgba(255,255,255,0.08)",
    cardGradStrongTo: "rgba(255,255,255,0.03)",

    // --fill-1..5
    fill1: "rgba(255,255,255,0.03)",
    fill2: "rgba(255,255,255,0.06)",
    fill3: "rgba(255,255,255,0.045)",
    fill4: "rgba(255,255,255,0.07)",
    fill5: "rgba(255,255,255,0.09)",

    // --border / --border-strong
    line: "rgba(255,255,255,0.06)",
    lineStrong: "rgba(255,255,255,0.12)",
    lineFocus: "rgba(6,182,212,0.45)",

    // Navigație: panoul lateral (.tabs @min-width:701px) și bara mobilă
    // (.mobile-tabs) au fundaluri proprii în Kultura, distincte de --surface.
    navPanel: "rgba(20,24,43,0.60)",
    navBarFrom: "rgba(26,31,53,0.92)",
    navBarTo: "rgba(14,17,32,0.88)",
    navBorder: "rgba(255,255,255,0.10)",

    // paleta Kultura
    accent: ACCENT,
    accent2: ACCENT_2,
    accentGlow: "rgba(6,182,212,0.30)",
    cyan: ACCENT, // alias istoric — accentul principal
    teal: "#14B8A6",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    violet: "#A78BFA",
    pink: "#EC4899",
    gold: "#F59E0B",
    amber: "#F59E0B",
    orange: "#F59E0B",
    green: "#10B981",
    red: "#EF4444",
    companion: "#8B5CF6",

    // --text / --text-dim / --text-mute
    text: "#FAFAFA",
    muted: "#A1A1AA",
    dim: "#71717A",

    white: "#FFFFFF",
    transparent: "transparent",
    isDark: true,
  },
  light: {
    bg: "#EEF1F7",
    bgSecondary: "#E7EBF3",
    bgElevated: "#FFFFFF",
    card: "rgba(255,255,255,0.78)",
    cardSolid: "#FFFFFF",
    cardHover: "#FFFFFF",
    cardLight: "#F4F7FC",

    cardGradFrom: "#FFFFFF",
    cardGradTo: "#F4F7FC",
    cardGradStrongFrom: "#FFFFFF",
    cardGradStrongTo: "#EEF2F9",

    fill1: "rgba(15,23,42,0.03)",
    fill2: "rgba(15,23,42,0.06)",
    fill3: "rgba(15,23,42,0.045)",
    fill4: "rgba(15,23,42,0.07)",
    fill5: "rgba(15,23,42,0.09)",

    line: "rgba(15,23,42,0.12)",
    lineStrong: "rgba(15,23,42,0.20)",
    lineFocus: "rgba(6,182,212,0.45)",

    navPanel: "rgba(255,255,255,0.72)",
    navBarFrom: "rgba(255,255,255,0.94)",
    navBarTo: "rgba(238,242,249,0.90)",
    navBorder: "rgba(15,23,42,0.10)",

    accent: ACCENT,
    accent2: ACCENT_2,
    accentGlow: "rgba(6,182,212,0.30)",
    cyan: ACCENT,
    teal: "#0D9488",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    violet: "#8B5CF6",
    pink: "#EC4899",
    gold: "#F59E0B",
    amber: "#F59E0B",
    orange: "#F59E0B",
    green: "#10B981",
    red: "#EF4444",
    companion: "#8B5CF6",

    text: "#0F172A",
    muted: "#475569",
    dim: "#94A3B8",

    white: "#FFFFFF",
    transparent: "transparent",
    isDark: false,
  },
};

// `colors` este un obiect MUTAT ÎN LOC la schimbarea temei. Importurile de tip
// `import { colors as C }` păstrează aceeași referință, deci toate fișierele
// văd automat noile valori după `applyTheme()` + remontarea aplicației.
export const colors = { ...palettes.dark };

// Fabricile de stiluri înregistrate (vezi themedStyles). Le re-executăm la
// schimbarea temei și mutăm rezultatul în obiectul original, ca referințele
// existente din module să rămână valide.
const styleRegistry = [];

export function themedStyles(factory) {
  const holder = factory(colors);
  styleRegistry.push({ holder, factory });
  return holder;
}

export let themeName = "dark";

export function applyTheme(name) {
  const next = palettes[name] || palettes.dark;
  themeName = name;
  Object.keys(colors).forEach((k) => { delete colors[k]; });
  Object.assign(colors, next);
  styleRegistry.forEach(({ holder, factory }) => {
    const fresh = factory(colors);
    Object.keys(holder).forEach((k) => { delete holder[k]; });
    Object.assign(holder, fresh);
  });
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 36,
};

// Raze din Kultura: .tab 12, .btn 14, .tabs 16, .card/.stat 22, .modal/.hero 24
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  btn: 14,
  xl: 22,
  xxl: 24,
  full: 999,
};

// Umbre moderne, subtile (folosite pe suprafețele ridicate).
// Umbre din Kultura: tab activ 0 6px 18px rgba(139,92,246,.35);
// buton 0 10px 24px var(--accent-glow); modal 0 30px 80px rgba(0,0,0,.5)
export const elevation = {
  low: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  button: {
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
  },
  modal: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
    elevation: 20,
  },
  // .mobile-tabs: 0 24px 48px -12px rgba(0,0,0,.55)
  nav: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.55,
    shadowRadius: 48,
    elevation: 16,
  },
  // .mtab.active: 0 8px 22px var(--accent-glow)
  navActive: {
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 22,
    elevation: 8,
  },
};

// Gradienți din Kultura
export const gradients = {
  hero: ["#7C3AED", "#3B82F6", "#06B6D4"],   // .hero 135deg
  tabActive: ["#3B82F6", "#8B5CF6"],          // .tab.active 90deg
  button: ["#06B6D4", "#8B5CF6"],             // .btn 90deg (accent → accent-2)
};

// Scară tipografică — ierarhie consistentă în toată aplicația.
export const typography = {
  display: { fontSize: 30, fontWeight: "900", letterSpacing: -0.8 },
  title: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  heading: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  body: { fontSize: 13, fontWeight: "600" },
  label: { fontSize: 9.5, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  caption: { fontSize: 11, fontWeight: "600" },
};
