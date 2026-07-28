import React from "react";
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius, themedStyles } from "../constants/theme";
import { GlassCard, StatCard } from "../components/DesignSystem";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { presenceMap } from "../utils/stats";
import { parseScore, resultOf } from "../utils/matches";
import { FadeInView, PressableScale } from "../components/ui/visuals";
import { BRAND_NAME } from "../constants/brand";
import { useTranslation } from "../i18n";

export default function DashboardScreen({ tasks, players, trainings, matches, transactions, currentUser, setTab, openNotifications, selectedClub, subscription, memberships = [], attendance = {} }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const canSeeClubState = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const incomeTotal = transactions.filter((row) => row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const expenseTotal = transactions.filter((row) => !row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const balance = incomeTotal - expenseTotal;

  // Prezența medie a clubului, din marcajele de la antrenamente.
  const avgAttendance = (() => {
    const buckets = Object.values(presenceMap(attendance));
    const total = buckets.reduce((s, b) => s + b.total, 0);
    const present = buckets.reduce((s, b) => s + b.present, 0);
    return total ? Math.round((present / total) * 100) : null;
  })();

  // Serii reale pentru sparkline-uri (tendințe).
  const matchesSpark = [...matches].filter((m) => parseScore(m.score)).reverse().slice(-10)
    .map((m) => { const r = resultOf(m.score); return r === "V" ? 3 : r === "E" ? 1 : 0; });
  let run = 0;
  const balanceSpark = [...transactions].reverse().slice(-12)
    .map((tx) => { run += tx.positive ? Number(tx.value || 0) : -Number(tx.value || 0); return run; });
  const attSpark = Object.keys(attendance).sort((a, b) => Number(a) - Number(b)).slice(-10)
    .map((tid) => { const bp = attendance[tid] || {}; const vals = Object.values(bp); const pres = vals.filter((s) => s === "present" || s === "late").length; return vals.length ? Math.round((pres / vals.length) * 100) : 0; });

  const stats = [
    { icon: "Users", label: t("dash.players"), value: players.length, color: C.cyan, spark: [] },
    { icon: "Dumbbell", label: t("dash.trainings"), value: trainings.length, color: C.purple, spark: [] },
    { icon: "Trophy", label: t("dash.matches"), value: matches.length, color: C.blue, spark: matchesSpark },
    { icon: "Wallet", label: t("dash.balance"), value: `${balance.toLocaleString("ro-RO")} lei`, color: balance >= 0 ? C.green : C.red, spark: balanceSpark },
  ];

  // Cartonașe suplimentare cu starea clubului, doar pentru staff.
  const clubStateStats = canSeeClubState ? [
    { icon: "CreditCard", label: t("dash.subscription"), value: subscription?.planName || selectedClub?.plan || "Free", color: C.amber },
    { icon: "UserCheck", label: t("dash.members"), value: memberships.length, color: C.violet },
    { icon: "CalendarCheck", label: t("dash.attendance"), value: avgAttendance == null ? "—" : `${avgAttendance}%`, color: C.green, spark: attSpark },
  ] : [];

  // Activitate recentă derivată din datele reale (cele mai noi înregistrări).
  const recentActivity = [
    ...players.slice(-2).map((p) => ({ icon: "User", title: t("dash.inSquad", { name: p.name }), meta: p.group })),
    ...trainings.slice(0, 2).map((tr) => ({ icon: "Dumbbell", title: tr.theme || t("dash.addTraining"), meta: `${tr.group} • ${tr.date}` })),
    ...matches.slice(0, 2).map((m) => ({ icon: "Trophy", title: t("dash.matchVs", { opponent: m.opponent }), meta: `${m.group} • ${m.date}` })),
  ].slice(0, 5);


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar
        title={t("dash.greeting", { name: currentUser?.name?.split(' ')[0] || t("dash.manager") })}
        eyebrow={`${BRAND_NAME} • Dashboard`}
      />

      {/* Grid Statistici */}
      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <FadeInView key={i} delay={i * 60} style={styles.statCell}>
            <StatCard {...s} trendUp={s.up} />
          </FadeInView>
        ))}
      </View>

      {/* Starea clubului (staff) */}
      {clubStateStats.length > 0 && (
        <>
          <SectionTitle title={t("dash.clubState")} />
          <View style={styles.statsGrid}>
            {clubStateStats.map((s, i) => (
              <FadeInView key={i} delay={i * 60} style={styles.statCell}>
                <StatCard {...s} />
              </FadeInView>
            ))}
          </View>
        </>
      )}

      {/* Quick Actions */}
      <SectionTitle title={t("dash.quickActions")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll} contentContainerStyle={styles.actionContent}>
        <QuickAction icon="UserPlus" label={t("dash.addPlayer")} color={C.cyan} onPress={() => setTab?.("Echipă")} />
        <QuickAction icon="PlusCircle" label={t("dash.addTraining")} color={C.purple} onPress={() => setTab?.("Antren.")} />
        <QuickAction icon="Trophy" label={t("dash.addMatch")} color={C.blue} onPress={() => setTab?.("Meciuri")} />
        <QuickAction icon="Send" label={t("dash.notify")} color={C.amber} onPress={openNotifications} />
      </ScrollView>

      <View style={[styles.gridMain, isMobile && styles.mobileGrid]}>
        {/* Activitate Recentă */}
        <GlassCard style={[styles.mainCol, isMobile && { width: "100%" }]}>
           <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{t("dash.recent")}</Text>
           </View>
           {recentActivity.length === 0 && (
             <Text style={styles.emptyText}>{t("dash.recentEmpty")}</Text>
           )}
           {recentActivity.map((item, index) => (
             <ActivityItem key={index} icon={item.icon} title={item.title} time="" user={item.meta} />
           ))}
        </GlassCard>

        {/* Sarcini Urgente */}
        <GlassCard style={[styles.sideCol, isMobile && { width: "100%", marginTop: spacing.lg }]}>
           <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{t("dash.urgentTasks")}</Text>
           </View>
           {tasks.filter(t => !t.done).slice(0, 3).map(task => (
             <TaskItem
               key={task.id}
               title={task.title}
               status={task.priority}
               color={task.priority === "URGENT" ? C.red : task.priority === "MEDIU" ? C.amber : C.blue}
               date={task.dueLabel || task.meta?.split(':')[1]?.trim() || t("dash.noDueDate")}
             />
           ))}
           {tasks.filter(t => !t.done).length === 0 && (
             <Text style={styles.emptyText}>{t("dash.noUrgentTasks")}</Text>
           )}
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const QuickAction = ({ icon, label, color, onPress }) => {
  const Icon = LucideIcons[icon];
  return (
    <PressableScale style={styles.quickAction} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.actionIcon, { backgroundColor: color + "10", borderColor: color + "30" }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
    </PressableScale>
  );
};

const ActivityItem = ({ icon, title, time, user }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}><Icon size={16} color={C.cyan} /></View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.activityMeta}>{[user, time].filter(Boolean).join(" • ")}</Text>
      </View>
    </View>
  );
};

const TaskItem = ({ title, status, color, date }) => (
  <View style={styles.taskItem}>
    <View style={styles.taskCheck} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.taskTitle} numberOfLines={1}>{title}</Text>
      <View style={styles.taskMetaRow}>
        <Text style={styles.taskDate}>{date}</Text>
        <View style={[styles.taskStatus, { backgroundColor: color + "20" }]}>
          <Text style={[styles.taskStatusText, { color }]}>{status}</Text>
        </View>
      </View>
    </View>
  </View>
);

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { padding: spacing.md, paddingBottom: 120 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs, marginBottom: spacing.lg },
  statCell: { flexGrow: 1, flexBasis: 160, minWidth: 160 },
  actionScroll: { marginHorizontal: -spacing.md, marginBottom: spacing.lg },
  actionContent: { paddingHorizontal: spacing.md, gap: 12 },
  quickAction: { width: 90, backgroundColor: C.card, borderRadius: radius.lg, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.line },
  actionIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 8 },
  actionLabel: { color: C.text, fontSize: 9, fontWeight: "800", textAlign: "center", textTransform: "uppercase" },
  gridMain: { flexDirection: "row", gap: spacing.lg },
  mobileGrid: { flexDirection: "column" },
  mainCol: { flex: 2 },
  sideCol: { flex: 1 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  cardTitle: { color: C.text, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  cardAction: { color: C.cyan, fontSize: 10, fontWeight: "700" },
  activityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  activityIcon: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: C.cyan + "1A", alignItems: "center", justifyContent: "center" },
  activityTitle: { color: C.text, fontSize: 12, fontWeight: "700" },
  activityMeta: { color: C.dim, fontSize: 10, marginTop: 2, fontWeight: "600" },
  taskItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line },
  taskCheck: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: C.lineStrong },
  taskTitle: { color: C.text, fontSize: 12, fontWeight: "700" },
  taskMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  taskDate: { color: C.muted, fontSize: 9, fontWeight: "700" },
  taskStatus: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  taskStatusText: { fontSize: 7, fontWeight: "900" },
  emptyText: { color: C.dim, fontSize: 11, textAlign: "center", paddingVertical: 20 }
}));
