import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, themedStyles } from "../../constants/theme";
import { Sparkline, FadeInView, PressableScale, EmptyState, SkeletonRow, Surface } from "../../components/ui/visuals";

// --- Paletă comună, derivată din tema globală a aplicației ---
// (înainte era o paletă paralelă; acum admin și club folosesc aceleași culori)
export const AD = {
  bg: C.bg,
  card: C.card,
  border: "rgba(255, 255, 255, 0.06)",
  cyan: C.cyan,
  violet: C.purple,
  amber: C.amber,
  green: C.green,
  red: C.red,
  blue: C.blue,
  dim: C.muted,
  faint: C.dim,
};

// Re-export ca ecranele admin să poată folosi aceleași primitive vizuale.
export { FadeInView, PressableScale, SkeletonRow, Sparkline, Surface };

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

export function AdminPage({ title, subtitle, eyebrow = "ADMINISTRARE PLATFORMĂ", children }) {
  return (
    <View style={s.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView style={s.pageHeader}>
          <View style={s.eyebrowRow}>
            <View style={s.eyebrowBar} />
            <Text style={s.eyebrow}>{eyebrow}</Text>
          </View>
          <Text style={s.pageTitle}>{title}</Text>
          {!!subtitle && <Text style={s.pageSub}>{subtitle}</Text>}
        </FadeInView>
        {children}
      </ScrollView>
    </View>
  );
}

// Card statistic premium: bandă de accent în gradient, valoare mare, sparkline.
export const StatCard = ({ icon, label, val, sub, iColor = AD.cyan, spark, delay = 0 }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <FadeInView delay={delay} style={s.statCell}>
      <Surface accent={iColor} contentStyle={s.statCardInner}>
        <View style={s.statTop}>
          <View style={[s.statIconWrap, { backgroundColor: iColor + "15", borderColor: iColor + "35" }]}>
            <Icon size={19} color={iColor} />
          </View>
          {spark ? <Sparkline data={spark} color={iColor} width={54} height={20} /> : null}
        </View>
        <Text style={s.statVal} numberOfLines={1}>{val}</Text>
        <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
        {!!sub && <Text style={s.statSub} numberOfLines={1}>{sub}</Text>}
      </Surface>
    </FadeInView>
  );
};

export const ActionBtn = ({ icon, label, color = AD.cyan, onPress }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <PressableScale onPress={onPress} style={[s.actionBtn, { borderColor: color + "30" }]}>
      <View style={[s.actionIconWrap, { backgroundColor: color + "16" }]}>
        <Icon size={14} color={color} />
      </View>
      <Text style={s.actionBtnText}>{label}</Text>
      <LucideIcons.ChevronRight size={14} color={AD.faint} />
    </PressableScale>
  );
};

export const Card = ({ title, action, onAction, children, style, delay = 0 }) => (
  <FadeInView delay={delay}>
    <Surface style={[s.cardOuter, style]} contentStyle={s.cardInner}>
      {!!title && (
        <View style={s.cardHead}>
          <View style={s.cardTitleRow}>
            <View style={s.cardAccent} />
            <Text style={s.cardTitle}>{title}</Text>
          </View>
          {!!action && (
            <Pressable onPress={onAction}><Text style={s.cardAction}>{action}</Text></Pressable>
          )}
        </View>
      )}
      {children}
    </Surface>
  </FadeInView>
);

export const EmptyBox = ({ icon = "Inbox", text, title, actionLabel, onAction }) => (
  <EmptyState icon={icon} title={title} subtitle={text} actionLabel={actionLabel} onAction={onAction} />
);

export const PlanBadge = ({ plan }) => (
  <View style={[s.planBadge, { backgroundColor: (PLAN_COLORS[plan] || AD.dim) + "15" }]}>
    <Text style={[s.planBadgeText, { color: PLAN_COLORS[plan] || AD.dim }]}>{plan}</Text>
  </View>
);

export const s = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scroll: { padding: 18, paddingBottom: 80 },

  pageHeader: { marginBottom: 24 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  eyebrowBar: { width: 18, height: 3, borderRadius: 2, backgroundColor: AD.cyan },
  eyebrow: { color: AD.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 },
  pageTitle: { color: C.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.8 },
  pageSub: { color: AD.dim, fontSize: 13, fontWeight: "600", marginTop: 5, lineHeight: 19 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 18 },
  statCell: { flexBasis: 180, flexGrow: 1, minWidth: 165 },
  statCardInner: { padding: 16 },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  statVal: { color: C.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.6 },
  statLabel: { color: AD.dim, fontSize: 9.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 },
  statSub: { color: AD.faint, fontSize: 9, fontWeight: "700", marginTop: 3 },

  actionsList: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  actionBtn: { flexBasis: 190, flexGrow: 1, height: 52, backgroundColor: "rgba(15,23,42,0.5)", borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderWidth: 1 },
  actionIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: C.text, fontSize: 11.5, fontWeight: "800", flex: 1 },

  cardOuter: { marginBottom: 14 },
  cardInner: { padding: 18 },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  cardAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: AD.cyan },
  cardTitle: { color: C.text, fontSize: 12.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  cardAction: { color: AD.cyan, fontSize: 11, fontWeight: "800" },
  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 26 },
  emptyText: { color: AD.dim, fontSize: 11, fontWeight: "600", lineHeight: 16, textAlign: "center" },

  th: { color: AD.faint, fontSize: 8.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  tableHeader: { flexDirection: "row", paddingBottom: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 10 },
  tableRow: { flexDirection: "row", alignItems: "center", minHeight: 64, paddingHorizontal: 12, marginBottom: 6, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: 1, borderColor: C.line },
  miniLogo: { width: 34, height: 34, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  rowMainText: { color: C.text, fontSize: 11, fontWeight: "800" },
  rowSubText: { color: AD.faint, fontSize: 9.5, fontWeight: "600" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  planBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
  planBadgeText: { fontSize: 8.5, fontWeight: "900" },

  rowBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 8, borderWidth: 1 },
  rowBtnText: { fontSize: 10, fontWeight: "800" },

  // Modal (reutilizat de paginile care au dialoguri)
  modalOverlay: { flex: 1, backgroundColor: C.isDark ? "rgba(0,0,0,0.72)" : "rgba(9,9,11,0.45)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: C.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: AD.border },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  modalLabel: { color: AD.dim, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: C.bgSecondary, borderWidth: 1, borderColor: C.line, color: C.text, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 12, fontWeight: "600", marginBottom: 12 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  modalSaveBtn: { height: 46, borderRadius: 12, backgroundColor: AD.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalSaveText: { color: C.text, fontSize: 12, fontWeight: "900" },
}));
