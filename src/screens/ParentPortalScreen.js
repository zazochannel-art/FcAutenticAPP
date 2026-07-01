import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { GlassCard, StatCard } from "../components/DesignSystem";
import { TopBar } from "../components/SharedComponents";

export default function ParentPortalScreen({ players, currentUser, openNotifications }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const stats = [
    { icon: "UserCheck", label: "Prezență", value: "88%", trend: "+5%", up: true, color: C.cyan },
    { icon: "Calendar", label: "Antrenamente", value: "3", trend: "1 azi", up: true, color: C.purple },
    { icon: "Wallet", label: "Plăți", value: "350", trend: "Mai", up: true, color: C.green },
    { icon: "Trophy", label: "Meci", value: "31 Mai", trend: "12:00", up: true, color: C.blue },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TopBar title="Portal părinte" eyebrow="MIHAI IONESCU • U16" openNotifications={openNotifications} />

      <View style={styles.statsGrid}>
        {stats.map((s, i) => <StatCard key={i} {...s} trendUp={s.up} />)}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll} contentContainerStyle={styles.actionContent}>
         <QuickAction icon="MessageSquare" label="Mesaj" color={C.blue} />
         <QuickAction icon="CreditCard" label="Achită" color={C.green} />
         <QuickAction icon="FileText" label="Document" color={C.purple} />
         <QuickAction icon="CheckCircle2" label="Confirmă" color={C.amber} />
      </ScrollView>

      <View style={[styles.mainLayout, isMobile && styles.mobileLayout]}>
        {/* Profil Copil */}
        <GlassCard style={[styles.profileCard, isMobile && { width: "100%" }]}>
          <View style={styles.cardHeader}>
             <Text style={styles.cardTitle}>Profil</Text>
             <View style={styles.statusBadge}><View style={styles.statusDot} /><Text style={styles.statusText}>ACTIV</Text></View>
          </View>
          <View style={styles.profileInfo}>
             <View style={styles.avatarWrap}><LucideIcons.User size={32} color="white" /></View>
             <View style={{ marginLeft: 12 }}>
                <Text style={styles.childName}>Mihai Ionescu</Text>
                <Text style={styles.childMeta}>U16 • Mijlocaș • #8</Text>
             </View>
          </View>
          <View style={styles.detailsList}>
             <DetailItem label="Antrenor" value="A. Popescu" />
             <DetailItem label="Medical" value="Valabil Aug" color={C.green} />
          </View>
        </GlassCard>

        {/* Programul Săptămânii */}
        <GlassCard style={[styles.scheduleCard, isMobile && { width: "100%", marginTop: spacing.lg }]}>
           <Text style={styles.cardTitle}>Program săptămânal</Text>
           <ScheduleItem day="LUNI" date="26" title="Antrenament" time="17:30" />
           <ScheduleItem day="MERC" date="28" title="Antrenament" time="18:00" />
           <ScheduleItem day="SÂMB" date="31" title="Meci vs Progresul" time="12:00" isImportant />
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const QuickAction = ({ icon, label, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <Pressable style={[styles.actionBtn, { borderColor: color + "30" }]}>
      <Icon size={18} color={color} />
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
};

const DetailItem = ({ label, value, color = "white" }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, { color }]}>{value}</Text>
  </View>
);

const ScheduleItem = ({ day, date, title, time, isImportant }) => (
  <View style={[styles.scheduleItem, isImportant && styles.scheduleImportant]}>
     <View style={styles.dateCol}>
        <Text style={styles.scheduleDay}>{day}</Text>
        <Text style={styles.scheduleDate}>{date}</Text>
     </View>
     <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.scheduleTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.scheduleTime}>{time}</Text>
     </View>
     <LucideIcons.ChevronRight size={14} color={C.dim} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: spacing.md, paddingBottom: 120 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -spacing.xs, marginBottom: spacing.lg },
  actionScroll: { marginHorizontal: -spacing.md, marginBottom: spacing.lg },
  actionContent: { paddingHorizontal: spacing.md, gap: 10 },
  actionBtn: { width: 90, height: 48, borderRadius: radius.md, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.02)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  actionLabel: { fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  mainLayout: { flexDirection: "row", gap: spacing.lg },
  mobileLayout: { flexDirection: "column" },
  profileCard: { flex: 1, padding: spacing.lg },
  scheduleCard: { flex: 1.2, padding: spacing.lg },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  cardTitle: { color: "white", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.green + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.green },
  statusText: { color: C.green, fontSize: 7, fontWeight: "900" },
  profileInfo: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  avatarWrap: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: "#0A1322", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  childName: { color: "white", fontSize: 15, fontWeight: "900" },
  childMeta: { color: C.muted, fontSize: 10, marginTop: 2, fontWeight: "700" },
  detailsList: { gap: 8 },
  detailItem: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)", paddingBottom: 6 },
  detailLabel: { color: C.dim, fontSize: 10, fontWeight: "700" },
  detailValue: { color: "white", fontSize: 10, fontWeight: "800" },
  scheduleItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  scheduleImportant: { backgroundColor: "rgba(255,255,255,0.02)", borderRadius: radius.md, paddingHorizontal: 8 },
  dateCol: { width: 35, alignItems: "center" },
  scheduleDay: { color: C.cyan, fontSize: 8, fontWeight: "900" },
  scheduleDate: { color: "white", fontSize: 14, fontWeight: "900" },
  scheduleTitle: { color: "white", fontSize: 12, fontWeight: "800" },
  scheduleTime: { color: C.muted, fontSize: 10, marginTop: 2, fontWeight: "600" }
});
