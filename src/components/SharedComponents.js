import React from "react";
import { Image, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, themedStyles } from "../constants/theme";
import { BeUIButton } from "./ui/be-ui-button";
import { BRAND_NAME } from "../constants/brand";

export function Badge({ size = 48 }) {
  return <Image source={require("../../assets/icon-square.png")} style={{ width: size, height: size, borderRadius: size * 0.24, resizeMode: "cover" }} />;
}

// Antetul de pagină: doar eyebrow + titlu. Logoul, clopoțelul și profilul stau
// în bara globală de sus (`MobileTopBar` pe mobil, `SaaSShell` pe desktop) — le
// aveam duplicate, iar ecranele de administrare nu le aveau deloc.
export function TopBar({ title, eyebrow = BRAND_NAME }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.topBar}>
      <View style={styles.topTitleWrap}>
        <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>
        <Text style={[styles.pageTitle, isMobile && { fontSize: 22 }]} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
}

export function SectionTitle({ title, action, onAction }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <BeUIButton
          label={action}
          variant="ghost"
          size="sm"
          onPress={onAction}
          textStyle={{ color: C.cyan, fontSize: 11, fontWeight: "800" }}
        />
      ) : null}
    </View>
  );
}

export function Metric({ icon, value, label, color }) {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function TrainingField({ label, value, onChange, placeholder, multiline = false }) {
  return (
    <View style={styles.trainingField}>
      <Text style={styles.trainingFieldLabel}>{label}</Text>
      <TextInput
        style={[styles.trainingInput, multiline && styles.trainingInputLarge]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
        multiline={multiline}
      />
    </View>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 20, marginTop: 8 },
  topTitleWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  eyebrow: { color: C.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, textAlign: "center", textTransform: 'uppercase' },
  pageTitle: { color: C.text, fontSize: 26, fontWeight: "900", marginTop: 4, textAlign: "center" },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 0.5 },
  metric: { flex: 1, alignItems: "center" },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  metricValue: { color: C.text, fontSize: 16, fontWeight: "900" },
  metricLabel: { color: C.dim, fontSize: 9, marginTop: 2, fontWeight: '700' },
  trainingField: { marginBottom: 16 },
  trainingFieldLabel: { color: C.dim, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  trainingInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, height: 44 },
  trainingInputLarge: { minHeight: 80, textAlignVertical: "top" },
}));
