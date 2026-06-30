import React from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../constants/theme";
import { BeUIButton } from "./ui/be-ui-button";

export function Badge({ size = 48 }) {
  return <Image source={require("../../assets/icon.png")} style={{ width: size, height: size, resizeMode: "contain" }} />;
}

export function TopBar({ title, eyebrow = "FC AUTENTIC • MANAGER", openNotifications }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.logoWrap}><Badge size={44} /></View>
      <View style={styles.topTitleWrap}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      <BeUIButton
        variant="secondary"
        size="icon"
        icon="Bell"
        onPress={openNotifications}
        style={{ width: 52, height: 52, borderRadius: 17 }}
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
          textStyle={{ color: C.blue, fontSize: 12, fontWeight: "700" }}
        />
      ) : null}
    </View>
  );
}

export function Metric({ icon, value, label, color }) {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}22` }]}>
        <Icon size={20} color={color} />
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
        placeholderTextColor={C.muted}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 22 },
  topTitleWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  eyebrow: { color: C.blue, fontSize: 9, fontWeight: "900", letterSpacing: 1.7, textAlign: "center" },
  pageTitle: { color: C.text, fontSize: 27, fontWeight: "900", marginTop: 4, textAlign: "center" },
  logoWrap: { width: 52, height: 52, borderRadius: 17, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  topNotifyButton: { width: 52, height: 52, borderRadius: 17, backgroundColor: C.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 11 },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: "800" },
  sectionAction: { color: C.blue, fontSize: 12, fontWeight: "700" },
  metric: { flex: 1, alignItems: "center" },
  metricIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 7 },
  metricValue: { color: C.text, fontSize: 17, fontWeight: "900" },
  metricLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
  trainingField: { marginBottom: 13 },
  trainingFieldLabel: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginBottom: 6 },
  trainingInput: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 12 },
  trainingInputLarge: { minHeight: 72, textAlignVertical: "top" },
});
