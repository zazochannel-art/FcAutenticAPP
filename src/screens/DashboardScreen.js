import React from "react";
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { GlassCard, StatCard } from "../components/DesignSystem";
import { TopBar, SectionTitle } from "../components/SharedComponents";
import { presenceMap } from "../utils/stats";
import { parseScore, resultOf } from "../utils/matches";
import { FadeInView, PressableScale } from "../components/ui/visuals";

export default function DashboardScreen({ tasks, players, trainings, matches, transactions, currentUser, setTab, openNotifications, selectedClub, subscription, memberships = [], attendance = {} }) {
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
    .map((t) => { run += t.positive ? Number(t.value || 0) : -Number(t.value || 0); return run; });
  const attSpark = Object.keys(attendance).sort((a, b) => Number(a) - Number(b)).slice(-10)
    .map((tid) => { const bp = attendance[tid] || {}; const vals = Object.values(bp); const pres = vals.filter((s) => s === "present" || s === "late").length; return vals.length ? Math.round((pres / vals.length) * 100) : 0; });

  const stats = [
    { icon: "Users", label: "Jucători", value: players.length, color: C.cyan },
    { icon: "Dumbbell", label: "Antrenamente", value: trainings.length, color: C.purple },
    { icon: "Trophy", label: "Meciuri", value: matches.length, color: C.blue, spark: matchesSpark },
    { icon: "Wallet", label: "Sold", value: `${balance.toLocaleString("ro-RO")} lei`, color: balance >= 0 ? C.green : C.red, spark: balanceSpark },
  ];

  // Cartonașe suplimentare cu starea clubului, doar pentru staff.
  const clubStateStats = canSeeClubState ? [
    { icon: "CreditCard", label: "Abonament", value: subscription?.planName || selectedClub?.plan || "Free", color: C.amber },
    { icon: "UserCheck", label: "Membri", value: memberships.length, color: C.violet },
    { icon: "CalendarCheck", label: "Prezență", value: avgAttendance == null ? "—" : `${avgAttendance}%`, color: C.green, spark: attSpark },
  ] : [];

  // Activitate recentă derivată din datele reale (cele mai noi înregistrări).
  const recentActivity = [
    ...players.slice(-2).map((p) => ({ icon: "User", title: `${p.name} este în lot`, meta: p.group })),
    ...trainings.slice(0, 2).map((t) => ({ icon: "Dumbbell", title: t.theme || "Antrenament", meta: `${t.group} • ${t.date}` })),
    ...matches.slice(0, 2).map((m) => ({ icon: "Trophy", title: `Meci vs ${m.opponent}`, meta: `${m.group} • ${m.date}` })),
  ].slice(0, 5);


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar
        title={`Salut, ${currentUser?.name?.split(' ')[0] || "Manager"}!`}
        eyebrow="FOOTBAL MANAGER • DASHBOARD"
        openNotifications={openNotifications}
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
          <SectionTitle title="Starea clubului" />
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
      <SectionTitle title="Acțiuni rapide" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll} contentContainerStyle={styles.actionContent}>
        <QuickAction icon="UserPlus" label="Jucător" color={C.cyan} onPress={() => setTab?.("Echipă")} />
        <QuickAction icon="PlusCircle" label="Antrenament" color={C.purple} onPress={() => setTab?.("Antren.")} />
        <QuickAction icon="Trophy" label="Meci" color={C.blue} onPress={() => setTab?.("Meciuri")} />
        <QuickAction icon="Send" label="Notificare" color={C.amber} onPress={openNotifications} />
      </ScrollView>

      <View style={[styles.gridMain, isMobile && styles.mobileGrid]}>
        {/* Activitate Recentă */}
        <GlassCard style={[styles.mainCol, isMobile && { width: "100%" }]}>
           <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Activitate recentă</Text>
           </View>
           {recentActivity.length === 0 && (
             <Text style={styles.emptyText}>Activitatea clubului va apărea aici după ce adaugi jucători, antrenamente sau meciuri.</Text>
           )}
           {recentActivity.map((item, index) => (
             <ActivityItem key={index} icon={item.icon} title={item.title} time="" user={item.meta} />
           ))}
        </GlassCard>

        {/* Sarcini Urgente */}
        <GlassCard style={[styles.sideCol, isMobile && { width: "100%", marginTop: spacing.lg }]}>
           <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Sarcini urgente</Text>
           </View>
           {tasks.filter(t => !t.done).slice(0, 3).map(task => (
             <TaskItem
               key={task.id}
               title={task.title}
               status={task.priority}
               color={task.priority === "URGENT" ? C.red : task.priority === "MEDIU" ? C.amber : C.blue}
               date={task.dueLabel || task.meta?.split(':')[1]?.trim() || "Fără termen"}
             />
           ))}
           {tasks.filter(t => !t.done).length === 0 && (
             <Text style={styles.emptyText}>Nicio sarcină urgentă.</Text>
           )}
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const QuickAction = ({ icon, label, color, onPress }) => {
  const Icon = LucideIcons[icon];
  return (
    <PressableScale style={styles.quickAction} onPress={onPress}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: spacing.md, paddingBottom: 120 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs, marginBottom: spacing.lg },
  statCell: { flexGrow: 1, flexBasis: 160, minWidth: 160 },
  actionScroll: { marginHorizontal: -spacing.md, marginBottom: spacing.lg },
  actionContent: { paddingHorizontal: spacing.md, gap: 12 },
  quickAction: { width: 90, backgroundColor: "rgba(15, 23, 42, 0.4)", borderRadius: radius.lg, padding: 12, alignItems: "center", borderWidth: 1, borderColor: C.line },
  actionIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 8 },
  actionLabel: { color: "white", fontSize: 9, fontWeight: "800", textAlign: "center", textTransform: "uppercase" },
  gridMain: { flexDirection: "row", gap: spacing.lg },
  mobileGrid: { flexDirection: "column" },
  mainCol: { flex: 2 },
  sideCol: { flex: 1 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  cardTitle: { color: "white", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  cardAction: { color: C.cyan, fontSize: 10, fontWeight: "700" },
  activityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  activityIcon: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: "rgba(0,212,255,0.1)", alignItems: "center", justifyContent: "center" },
  activityTitle: { color: "white", fontSize: 12, fontWeight: "700" },
  activityMeta: { color: C.dim, fontSize: 10, marginTop: 2, fontWeight: "600" },
  taskItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  taskCheck: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  taskTitle: { color: "white", fontSize: 12, fontWeight: "700" },
  taskMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  taskDate: { color: C.muted, fontSize: 9, fontWeight: "700" },
  taskStatus: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 },
  taskStatusText: { fontSize: 7, fontWeight: "900" },
  emptyText: { color: C.dim, fontSize: 11, textAlign: "center", paddingVertical: 20 }
});
