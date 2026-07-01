import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { GlassCard, StatCard } from "../components/DesignSystem";
import { TopBar, SectionTitle } from "../components/SharedComponents";

export default function DashboardScreen({ tasks, toggleTask, players, trainings, matches, attendance, transactions, clubSettings, currentUser, setTab, selectedClub, subscription, memberships, invitations, openNotifications }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const incomeTotal = transactions.filter((row) => row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const expenseTotal = transactions.filter((row) => !row.positive).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const balance = incomeTotal - expenseTotal;

  const stats = [
    { icon: "Users", label: "Jucători", value: players.length, trend: "+12%", up: true, color: C.cyan },
    { icon: "Dumbbell", label: "Antrenamente", value: trainings.length, trend: "+3", up: true, color: C.purple },
    { icon: "Trophy", label: "Meciuri", value: matches.length, trend: "0", up: true, color: C.blue },
    { icon: "Wallet", label: "Sold", value: `${(balance / 1000).toFixed(1)}k`, trend: "+5%", up: true, color: C.green },
  ];

  const canSeeClubState = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar
        title={`Salut, ${currentUser?.name?.split(' ')[0] || "Manager"}!`}
        eyebrow="FC AUTENTIC • DASHBOARD"
        openNotifications={openNotifications}
      />

      {/* Grid Statistici */}
      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} trendUp={s.up} />
        ))}
      </View>

      {/* Quick Actions */}
      <SectionTitle title="Acțiuni rapide" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll} contentContainerStyle={styles.actionContent}>
        <QuickAction icon="UserPlus" label="Jucător" color={C.cyan} />
        <QuickAction icon="PlusCircle" label="Antrenament" color={C.purple} />
        <QuickAction icon="Trophy" label="Meci" color={C.blue} />
        <QuickAction icon="Send" label="Notificare" color={C.amber} />
      </ScrollView>

      <View style={[styles.gridMain, isMobile && styles.mobileGrid]}>
        {/* Activitate Recentă */}
        <GlassCard style={[styles.mainCol, isMobile && { width: "100%" }]}>
           <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Activitate recentă</Text>
              <Text style={styles.cardAction}>Vezi tot</Text>
           </View>
           <ActivityItem icon="User" title="Mihai I. adăugat" time="10:24" user="Popescu" />
           <ActivityItem icon="Dumbbell" title="Antrenament creat" time="Ieri" user="Marinescu" />
           <ActivityItem icon="Trophy" title="Meci vs Progresul" time="Ieri" user="Popescu" />
        </GlassCard>

        {/* Sarcini Urgente */}
        <GlassCard style={[styles.sideCol, isMobile && { width: "100%", marginTop: spacing.lg }]}>
           <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Sarcini urgente</Text>
           </View>
           {tasks.filter(t => !t.done).slice(0, 3).map(task => (
             <TaskItem key={task.id} title={task.title} status={task.priority} color={task.color} date={task.meta?.split(':')[1]?.trim() || "Azi"} />
           ))}
           {tasks.filter(t => !t.done).length === 0 && (
             <Text style={styles.emptyText}>Nicio sarcină urgentă.</Text>
           )}
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const QuickAction = ({ icon, label, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <Pressable style={styles.quickAction}>
      <View style={[styles.actionIcon, { backgroundColor: color + "10", borderColor: color + "30" }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
};

const ActivityItem = ({ icon, title, time, user }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}><Icon size={16} color={C.cyan} /></View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.activityTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.activityMeta}>{user} • {time}</Text>
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
