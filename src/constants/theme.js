// Sistem de design unificat al aplicației.
// Paletă neutră (zinc) cu accente reținute — fundal aproape negru, suprafețe
// stratificate și borduri discrete. Accentele se folosesc doar în punctele
// focale (nu ca borduri peste tot), pentru un aspect modern, curat.
export const colors = {
  // Fundaluri
  bg: "#09090B",
  bgSecondary: "#0F0F12",
  bgElevated: "#131316",

  // Suprafețe (carduri) — stratificare prin luminozitate, nu prin bordură colorată
  card: "#18181B",
  cardHover: "#1F1F23",
  cardLight: "#212126",

  // Borduri neutre, discrete
  line: "rgba(255, 255, 255, 0.07)",
  lineStrong: "rgba(255, 255, 255, 0.12)",
  lineFocus: "rgba(6, 182, 212, 0.45)",

  // Accente
  cyan: "#06B6D4",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  violet: "#A78BFA",
  gold: "#FBBF24",
  amber: "#F59E0B",
  green: "#22C55E",
  red: "#EF4444",

  // Text
  text: "#FAFAFA",
  muted: "#A1A1AA",
  dim: "#71717A",

  // Speciale
  white: "#FFFFFF",
  transparent: "transparent",
};

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
