import React from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, spacing, elevation, themedStyles, gradients } from "../constants/theme";
import { Sparkline, Surface } from "./ui/visuals";

// --- GlassCard: suprafața de bază. Stratificare prin luminozitate + bordură
// neutră discretă (nu accent colorat), cu umbră subtilă. ---
export const GlassCard = ({ children, style, accent }) => (
  <Surface style={style} contentStyle={styles.glassContent} accent={accent}>
    {children}
  </Surface>
);

// --- StatCard: Carduri statistice de sus ---
// Pe telefon cardul era prea voluminos: o cifră singură ocupa aproape 140px
// înălțime. Aceleași proporții, doar mai strânse — pe desktop, unde spațiul nu
// e o problemă, rămân cele de dinainte.
export const StatCard = ({ icon, label, value, trend, trendUp, color = C.cyan, spark }) => {
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 380;
  const isMobile = width < 768;
  const Icon = LucideIcons[icon] || LucideIcons.Activity;

  return (
    <Surface style={[styles.statCard, isSmallMobile && { minWidth: "45%" }]} contentStyle={isMobile ? styles.statContentMobile : styles.statContent}>
      <View style={[styles.statHeader, isMobile && styles.statHeaderMobile]}>
        {/* .stat-icon — 40×40, rază 12, gradient 135° din culoare 0.28 → 0.10 */}
        <LinearGradient
          colors={[color + "47", color + "1A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.statIconWrap, isMobile && styles.statIconWrapMobile]}
        >
          <Icon size={isSmallMobile ? 15 : isMobile ? 17 : 20} color={color} />
        </LinearGradient>
        {trend ? (
          <View style={[styles.trendWrap, { backgroundColor: (trendUp ? C.green : C.red) + "26" }]}>
            <LucideIcons.ArrowUpRight size={10} color={trendUp ? C.green : C.red} style={{ transform: [{ rotate: trendUp ? "0deg" : "90deg" }] }} />
            <Text style={[styles.trendText, { color: trendUp ? C.green : C.red }]}>{trend}</Text>
          </View>
        ) : (spark ? <Sparkline data={spark} color={color} width={58} height={22} /> : null)}
      </View>
      <Text style={[styles.statValue, isMobile && styles.statValueMobile, isSmallMobile && { fontSize: 19 }]}>{value}</Text>
      <Text style={[styles.statLabel, isMobile && styles.statLabelMobile]} numberOfLines={1}>{label}</Text>
    </Surface>
  );
};

// --- NeonButton: Butonul principal cu gradient și glow ---
export const NeonButton = ({ label, icon, onPress, variant = "primary", fullWidth, style }) => {
  const Icon = icon ? LucideIcons[icon] : null;
  const gradientColors = variant === "danger" ? [C.red, "#991B1B"] : gradients.button;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.neonBtnContainer,
      fullWidth && { width: "100%" },
      pressed && { scale: 0.98 },
      style
    ]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.neonBtnGradient}
      >
        <View style={styles.neonBtnContent}>
          {Icon && <Icon size={18} color="white" style={{ marginRight: 8 }} />}
          <Text style={styles.neonBtnText}>{label}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = themedStyles((C) => StyleSheet.create({
  // .card — padding 20px
  glassContent: { padding: 20 },

  // .stat — padding 18px
  statCard: { flex: 1, minWidth: 160, margin: spacing.xs },
  statContent: { padding: 18 },
  statContentMobile: { padding: 13 },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statHeaderMobile: { marginBottom: 8 },
  statIconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  statIconWrapMobile: { width: 34, height: 34 },
  statValue: { color: C.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  statValueMobile: { fontSize: 21 },
  statLabel: { color: C.muted, fontSize: 12, fontWeight: "500", marginTop: 2 },
  statLabelMobile: { fontSize: 11 },
  // .stat-trend — 3px 8px, rază 8, 10px/700
  trendWrap: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  trendText: { fontSize: 10, fontWeight: "700" },

  neonBtnContainer: { height: 52, borderRadius: radius.btn, overflow: "hidden", ...elevation.button },
  neonBtnGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  neonBtnContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl },
  neonBtnText: { color: C.text, fontWeight: "900", fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" }
}));
