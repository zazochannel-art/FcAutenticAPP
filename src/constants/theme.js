// Sistem de design unificat al aplicației.
// Paletă neutră (zinc) cu accente reținute — fundal aproape negru, suprafețe
// stratificate și borduri discrete. Accentele se folosesc doar în punctele
// focale (nu ca borduri peste tot), pentru un aspect modern, curat.
// Accentul principal: verde-gazon, potrivit tematic cu fotbalul.
// Cheia `cyan` rămâne ca alias istoric (e folosită în ~260 de locuri);
// numele nou și corect este `accent`.
const ACCENT_DARK = "#4ADE80"; // verde-gazon, pe fundal închis
const ACCENT_LIGHT = "#16A34A"; // varianta mai închisă, lizibilă pe alb

// --- Paletele celor două teme ------------------------------------------------
export const palettes = {
  dark: {
    bg: "#080C09",
    bgSecondary: "#0C130E",
    bgElevated: "#101A14",

    glowA: "rgba(74, 222, 128, 0.10)",
    glowB: "rgba(139, 92, 246, 0.09)",
    glowC: "rgba(56, 189, 248, 0.07)",

    // Suprafețe verzi profunde (gradient de la cardHover spre card)
    card: "#101A14",
    cardHover: "#18291F",
    cardLight: "#1E3327",
    // Auriu — culoarea care merge cel mai bine cu verdele de gazon
    // (verde teren + auriu trofeu). Folosit ca accent secundar.
    companion: "#FBBF24",

    line: "rgba(134, 239, 172, 0.10)",
    lineStrong: "rgba(134, 239, 172, 0.18)",
    lineFocus: "rgba(74, 222, 128, 0.45)",

    accent: ACCENT_DARK,
    cyan: ACCENT_DARK, // alias istoric — accentul principal
    teal: "#06B6D4",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    violet: "#A78BFA",
    gold: "#FBBF24",
    amber: "#F59E0B",
    green: "#22C55E",
    red: "#EF4444",

    text: "#FAFAFA",
    muted: "#A1A1AA",
    dim: "#71717A",

    white: "#FFFFFF",
    transparent: "transparent",
    isDark: true,
  },
  light: {
    bg: "#F7FCF9",
    bgSecondary: "#EFF7F2",
    bgElevated: "#FFFFFF",

    glowA: "rgba(22, 163, 74, 0.09)",
    glowB: "rgba(139, 92, 246, 0.07)",
    glowC: "rgba(56, 189, 248, 0.06)",

    card: "#F4FBF6",
    cardHover: "#FFFFFF",
    cardLight: "#E8F5EC",
    companion: "#D97706",

    line: "rgba(22, 101, 52, 0.14)",
    lineStrong: "rgba(22, 101, 52, 0.22)",
    lineFocus: "rgba(22, 163, 74, 0.45)",

    accent: ACCENT_LIGHT,
    cyan: ACCENT_LIGHT,
    teal: "#0891B2",
    blue: "#2563EB",
    purple: "#7C3AED",
    violet: "#8B5CF6",
    gold: "#D97706",
    amber: "#D97706",
    green: "#16A34A",
    red: "#DC2626",

    text: "#18181B",
    muted: "#52525B",
    dim: "#71717A",

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

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

// Umbre moderne, subtile (folosite pe suprafețele ridicate).
export const elevation = {
  low: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 6,
  },
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
