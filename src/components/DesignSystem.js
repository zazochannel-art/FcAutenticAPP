import React from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, spacing, elevation, themedStyles } from "../constants/theme";
import { Sparkline, Surface } from "./ui/visuals";

// --- GlassCard: suprafața de bază. Stratificare prin luminozitate + bordură
// neutră discretă (nu accent colorat), cu umbră subtilă. ---
export const GlassCard = ({ children, style, accent }) => (
  <Surface style={style} contentStyle={styles.glassContent} accent={accent}>
    {children}
  </Surface>
);

// --- StatCard: Carduri statistice de sus ---
export const StatCard = ({ icon, label, value, trend, trendUp, color = C.cyan, spark }) => {
  const { width } = useWindowDimensions();
  const isSmallMobile = width < 380;
  const Icon = LucideIcons[icon] || LucideIcons.Activity;

  return (
    <GlassCard style={[styles.statCard, isSmallMobile && { minWidth: "45%" }]} accent={color}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconWrap, { backgroundColor: color + "15", borderColor: color + "30" }]}>
          <Icon size={isSmallMobile ? 16 : 20} color={color} />
        </View>
        {trend ? (
          <View style={styles.trendWrap}>
            <LucideIcons.ArrowUpRight size={10} color={trendUp ? C.green : C.red} style={{ transform: [{ rotate: trendUp ? "0deg" : "90deg" }] }} />
            <Text style={[styles.trendText, { color: trendUp ? C.green : C.red }]}>{trend}</Text>
          </View>
        ) : (spark ? <Sparkline data={spark} color={color} width={58} height={22} /> : null)}
      </View>
      <Text style={[styles.statValue, isSmallMobile && { fontSize: 20 }]}>{value}</Text>
      <Text style={[styles.statLabel, isSmallMobile && { fontSize: 9 }]} numberOfLines={1}>{label}</Text>
    </GlassCard>
  );
};

// --- NeonButton: Butonul principal cu gradient și glow ---
export const NeonButton = ({ label, icon, onPress, variant = "primary", fullWidth, style }) => {
  const Icon = icon ? LucideIcons[icon] : null;
  const gradientColors = variant === "danger" ? [C.red, "#991B1B"] : [C.cyan, C.purple];

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
  glassWrapper: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
    backgroundColor: C.card,
    ...elevation.low,
  },
  glassBlur: { flex: 1 },
  glassContent: { padding: spacing.lg },

  statCard: { flex: 1, minWidth: 160, margin: spacing.xs },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  statIconWrap: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  statValue: { color: C.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.7 },
  statLabel: { color: C.muted, fontSize: 10, fontWeight: "800", marginTop: spacing.xs, textTransform: "uppercase", letterSpacing: 1 },
  trendWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendText: { fontSize: 10, fontWeight: "800" },

  neonBtnContainer: { height: 52, borderRadius: radius.lg, overflow: "hidden", shadowColor: C.cyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  neonBtnGradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  neonBtnContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.xl },
  neonBtnText: { color: C.text, fontWeight: "900", fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase" }
}));
