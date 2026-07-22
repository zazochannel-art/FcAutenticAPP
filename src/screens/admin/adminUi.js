import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";

// --- Paletă comună pentru panoul de administrare a platformei ---
export const AD = {
  bg: "#020812",
  card: "rgba(4, 18, 32, 0.78)",
  border: "rgba(0, 212, 255, 0.12)",
  cyan: "#00D4FF",
  violet: "#7C3AED",
  amber: "#FACC15",
  green: "#22C55E",
  red: "#EF4444",
  blue: "#0D8BFF",
  dim: "#94A3B8",
  faint: "#475569",
};

// Prețuri de listă pentru MRR estimat (nu există facturare reală încă).
export const PLAN_PRICES = { Free: 0, Starter: 299, Basic: 299, Pro: 599, Elite: 999, Academy: 999 };
export const PLAN_COLORS = { Free: AD.dim, Starter: AD.blue, Basic: AD.blue, Pro: AD.violet, Elite: AD.amber, Academy: AD.amber };
export const PLAN_OPTIONS = ["Free", "Starter", "Pro", "Elite"];

export function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export function confirmAction(title, msg, onConfirm) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: "Anulează", style: "cancel" },
      { text: "Confirmă", style: "destructive", onPress: onConfirm },
    ]);
  }
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminPage({ title, subtitle, children }) {
  return (
    <View style={s.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>{title}</Text>
          {!!subtitle && <Text style={s.pageSub}>{subtitle}</Text>}
        </View>
        {children}
      </ScrollView>
    </View>
  );
}

export const StatCard = ({ icon, label, val, sub, iColor = AD.cyan }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={s.statCard}>
      <View style={[s.statIconWrap, { backgroundColor: iColor + "10", borderColor: iColor + "30" }]}>
        <Icon size={20} color={iColor} />
      </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={s.statVal} numberOfLines={1}>{val}</Text>
        <Text style={s.statLabel}>{label}</Text>
        {!!sub && <Text style={s.statSub} numberOfLines={1}>{sub}</Text>}
      </View>
    </View>
  );
};

export const ActionBtn = ({ icon, label, color = AD.cyan, onPress }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <Pressable onPress={onPress} style={s.actionBtn}>
      <Icon size={15} color={color} />
      <Text style={s.actionBtnText}>{label}</Text>
    </Pressable>
  );
};

export const Card = ({ title, children, style }) => (
  <View style={[s.card, style]}>
    {!!title && <Text style={s.cardTitle}>{title}</Text>}
    {children}
  </View>
);

export const EmptyBox = ({ icon = "Inbox", text }) => (
  <View style={s.emptyBox}>
    {React.createElement(LucideIcons[icon] || LucideIcons.Inbox, { size: 26, color: AD.faint })}
    <Text style={s.emptyText}>{text}</Text>
  </View>
);

export const PlanBadge = ({ plan }) => (
  <View style={[s.planBadge, { backgroundColor: (PLAN_COLORS[plan] || AD.dim) + "15" }]}>
    <Text style={[s.planBadgeText, { color: PLAN_COLORS[plan] || AD.dim }]}>{plan}</Text>
  </View>
);

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: AD.bg },
  scroll: { padding: 18, paddingBottom: 80 },

  pageHeader: { marginBottom: 22 },
  pageTitle: { color: "white", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  pageSub: { color: AD.dim, fontSize: 13, fontWeight: "600", marginTop: 3 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: { flexBasis: 180, flexGrow: 1, backgroundColor: AD.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: AD.border, flexDirection: "row", alignItems: "center" },
  statIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  statVal: { color: "white", fontSize: 16, fontWeight: "900" },
  statLabel: { color: AD.dim, fontSize: 9.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 1 },
  statSub: { color: AD.faint, fontSize: 8.5, fontWeight: "700", marginTop: 1 },

  actionsList: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  actionBtn: { flexBasis: 170, flexGrow: 1, height: 42, backgroundColor: "rgba(15,23,42,0.4)", borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  actionBtnText: { color: "white", fontSize: 11, fontWeight: "800" },

  card: { backgroundColor: AD.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: AD.border, marginBottom: 14 },
  cardTitle: { color: "white", fontSize: 12.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 26 },
  emptyText: { color: AD.dim, fontSize: 11, fontWeight: "600", lineHeight: 16, textAlign: "center" },

  th: { color: AD.faint, fontSize: 8.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  tableHeader: { flexDirection: "row", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", marginBottom: 4 },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: 54, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  miniLogo: { width: 26, height: 26, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
  rowMainText: { color: "white", fontSize: 11, fontWeight: "800" },
  rowSubText: { color: AD.faint, fontSize: 9.5, fontWeight: "600" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  planBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  planBadgeText: { fontSize: 8.5, fontWeight: "900" },

  rowBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 8, borderWidth: 1 },
  rowBtnText: { fontSize: 10, fontWeight: "800" },

  // Modal (reutilizat de paginile care au dialoguri)
  modalOverlay: { flex: 1, backgroundColor: "rgba(2,6,23,0.85)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: "#071127", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: AD.border },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: "white", fontSize: 15, fontWeight: "900" },
  modalLabel: { color: AD.dim, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: "rgba(2,6,23,0.6)", borderWidth: 1, borderColor: "#1e293b", color: "white", borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: AD.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalSaveText: { color: "white", fontSize: 12, fontWeight: "900" },
});
