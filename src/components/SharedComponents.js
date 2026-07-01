import React from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius, spacing } from "../constants/theme";
import { BeUIButton } from "./ui/be-ui-button";

export function Badge({ size = 48 }) {
  return <Image source={require("../../assets/icon.png")} style={{ width: size, height: size, resizeMode: "contain" }} />;
}

export function TopBar({ title, eyebrow = "FC AUTENTIC • MANAGER", openNotifications }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.topBar}>
      <View style={styles.logoWrap}><Badge size={isMobile ? 32 : 40} /></View>
      <View style={styles.topTitleWrap}>
        <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>
        <Text style={[styles.pageTitle, isMobile && { fontSize: 22 }]} numberOfLines={1}>{title}</Text>
      </View>
      <BeUIButton
        variant="secondary"
        size="icon"
        icon="Bell"
        onPress={openNotifications}
        style={{ width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: 12 }}
        aria-label="Notificări"
      />
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

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 20, marginTop: 8 },
  topTitleWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  eyebrow: { color: C.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, textAlign: "center", textTransform: 'uppercase' },
  pageTitle: { color: "white", fontSize: 26, fontWeight: "900", marginTop: 4, textAlign: "center" },
  logoWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(15,23,42,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: "white", fontSize: 16, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 0.5 },
  metric: { flex: 1, alignItems: "center" },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  metricValue: { color: "white", fontSize: 16, fontWeight: "900" },
  metricLabel: { color: C.dim, fontSize: 9, marginTop: 2, fontWeight: '700' },
  trainingField: { marginBottom: 16 },
  trainingFieldLabel: { color: C.dim, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  trainingInput: { backgroundColor: "rgba(2,6,23,0.5)", borderWidth: 1, borderColor: "#1e293b", color: "white", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, height: 44 },
  trainingInputLarge: { minHeight: 80, textAlignVertical: "top" },
});
